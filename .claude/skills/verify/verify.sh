#!/usr/bin/env zsh
# Disposable html-plan-host instance for verification: own Postgres cluster, own server, own secrets.
# Usage: verify.sh up|doctor|cli <html-plan args...>|psql <sql>|down   (state in $VERIFY_RUN, default /tmp/hph-verify)
# VERIFY_TAILNET=1 also forwards <tailnet-ip>:<app port> to the loopback server for a preview browser that reaches this Mac over Tailscale.
# VERIFY_FAULT=<stage> makes up fail after that stage to prove rollback (initdb, pg, server, forwarder).
set -euo pipefail
umask 077
SKILL_DIR=${0:A:h}
REPO=${SKILL_DIR:h:h:h}
RUN=${${VERIFY_RUN:-/tmp/hph-verify}:a}
STATE=$RUN/state.env
RUN_REF=$(print -r -- ${RUN:t} | tr A-Z a-z | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')
[[ -n $RUN_REF ]] || { print -u2 "FAIL: run name has no identity segment"; exit 1; }
SAFE_PATH=/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin

fail() { print -u2 "FAIL: $*"; exit 1 }
fault() { [[ ${VERIFY_FAULT:-} != $1 ]] || fail "injected fault after $1" }
listener() { lsof -nP -iTCP@${2:-127.0.0.1}:$1 -sTCP:LISTEN -t 2>/dev/null | head -1 }
anylistener() { lsof -nP -iTCP:$1 -sTCP:LISTEN -t 2>/dev/null | head -1 }
pargs() { ps -o args= -p $1 2>/dev/null }
plstart() { ps -o lstart= -p $1 2>/dev/null }
pcwd() { lsof -a -p $1 -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' }
revision() { local d=""; [[ -n $(git -C $REPO status --porcelain) ]] && d="-dirty"; print "$(git -C $REPO rev-parse HEAD)$d" }
record() { print -r -- "$1=${(q)2}" >>$STATE; typeset -g "$1=$2" }

# 0 = live and ours, 1 = gone or never recorded, 2 = PID alive but not the process this run started.
owned() {
  local p=$1_PID a=$1_ARGS s=$1_LSTART
  local pid=${(P)p:-} want_args=${(P)a:-} want_start=${(P)s:-}
  [[ -n $pid ]] && kill -0 $pid 2>/dev/null || return 1
  [[ -n $want_args && $(pargs $pid) == $want_args ]] || return 2
  [[ -z $want_start || $(plstart $pid) == $want_start ]] || return 2
  [[ $1 != SERVER || $(pcwd $pid) == $REPO ]] || return 2
  return 0
}

# Start a process detached, record its PID at once, then its argv and start time once exec settles.
spawn() {
  local name=$1 log=$2 want=$3; shift 3
  nohup "$@" >$log 2>&1 &
  record ${name}_PID $!
  record ${name}_ARGS $want
  for i in {1..50}; do [[ $(pargs ${(P)${:-${name}_PID}}) == $want ]] && break; sleep 0.1; done
  [[ $(pargs ${(P)${:-${name}_PID}}) == $want ]] || fail "$name never reached argv '$want'"
  record ${name}_LSTART "$(plstart ${(P)${:-${name}_PID}})"
}

up() {
  [[ -e $RUN || -L $RUN ]] && fail "$RUN already exists; refusing to reuse it or delete it later (run down for a prior run, or set VERIFY_RUN)"
  local app_port=${VERIFY_APP_PORT:-5513} pg_port=${VERIFY_PG_PORT:-5514} tsip=""
  for p in $app_port $pg_port; do [[ -z $(anylistener $p) ]] || fail "port $p already has a listener; refusing to share"; done
  if [[ ${VERIFY_TAILNET:-} == 1 ]]; then
    tsip=$(/Applications/Tailscale.app/Contents/MacOS/Tailscale ip -4 2>/dev/null | head -1)
    [[ $tsip == 100.* ]] || fail "VERIFY_TAILNET=1 but no Tailscale IPv4 address"
  fi
  [[ -d $REPO/node_modules ]] || (cd $REPO && bun install --frozen-lockfile >/dev/null)
  mkdir -m 700 $RUN
  UP_OWNS_RUN=1
  record APP_PORT $app_port
  record PG_PORT $pg_port
  record URL http://127.0.0.1:$app_port
  record PG_DATA $RUN/pg
  initdb -D $PG_DATA -U verify --auth=trust >$RUN/initdb.log
  fault initdb
  pg_ctl -D $PG_DATA -o "-p $pg_port -k $RUN -c listen_addresses=127.0.0.1 -c cluster_name=html-plan-host:verify-postgres@$RUN_REF" -l $RUN/pg.log -w start >/dev/null
  local pgpid=$(head -1 $PG_DATA/postmaster.pid)
  record PG_PID $pgpid
  record PG_ARGS "$(pargs $pgpid)"
  record PG_LSTART "$(plstart $pgpid)"
  fault pg
  createdb -h 127.0.0.1 -p $pg_port -U verify html_plan_host_verify
  record TOKEN $(openssl rand -hex 32)
  record REVISION $(revision)
  cd $REPO
  spawn SERVER $RUN/server.log "bun run $REPO/src/index.ts --identity html-plan-host:verify@$RUN_REF" env -i PATH=$SAFE_PATH HOME=$RUN \
    DATABASE_URL=postgres://verify@127.0.0.1:$pg_port/html_plan_host_verify DATABASE_SSL=disable \
    SESSION_SECRET=$(openssl rand -hex 32) PUBLISH_TOKEN=$TOKEN \
    HOST=127.0.0.1 PORT=$app_port APP_REVISION=$REVISION THEME=zinc \
    bun run $REPO/src/index.ts --identity html-plan-host:verify@$RUN_REF
  for i in {1..50}; do curl -fsS $URL/healthz >/dev/null 2>&1 && break; sleep 0.2; done
  fault server
  if [[ -n $tsip ]]; then
    record TS_IP $tsip
    spawn FWD $RUN/forward.log "bun $SKILL_DIR/tailnet-forward.ts $tsip $app_port --identity html-plan-host:verify-forwarder@$RUN_REF" bun $SKILL_DIR/tailnet-forward.ts $tsip $app_port --identity html-plan-host:verify-forwarder@$RUN_REF
    for i in {1..25}; do [[ $(listener $app_port $tsip) == $FWD_PID ]] && break; sleep 0.2; done
  fi
  fault forwarder
  record STARTED $(date -u +%FT%TZ)
  doctor
}

load() {
  [[ ! -L $RUN && -r $STATE ]] || fail "no state at $STATE; run up"
  source $STATE
  [[ -z ${VERIFY_APP_PORT:-} || $VERIFY_APP_PORT == $APP_PORT ]] || fail "VERIFY_APP_PORT=$VERIFY_APP_PORT conflicts with this run's port $APP_PORT"
  [[ -z ${VERIFY_PG_PORT:-} || $VERIFY_PG_PORT == $PG_PORT ]] || fail "VERIFY_PG_PORT=$VERIFY_PG_PORT conflicts with this run's port $PG_PORT"
}

doctor() {
  [[ -n ${STARTED:-} ]] || fail "setup never finished for $RUN; run down"
  local n rc
  for n in SERVER PG ${FWD_PID:+FWD}; do
    owned $n && rc=0 || rc=$?
    (( rc == 0 )) || fail "$n is not the process this run started (pid ${(P)${:-${n}_PID}}, check $rc)"
  done
  [[ $(listener $APP_PORT) == $SERVER_PID ]] || fail "port $APP_PORT owned by '$(listener $APP_PORT)', not $SERVER_PID"
  [[ $(listener $PG_PORT) == $PG_PID ]] || fail "port $PG_PORT owned by '$(listener $PG_PORT)', not $PG_PID"
  local live
  live=$(curl -fsS $URL/version) || fail "/version unreachable"
  [[ $live == *"\"$(revision)\""* ]] || fail "served revision $live, checkout is $(revision)"
  local code=$(curl -s -o /dev/null -w '%{http_code}' $URL/)
  [[ $code == 200 ]] || fail "GET / returned $code (auth must be off on the verify instance)"
  print "OK server pid=$SERVER_PID lstart='$SERVER_LSTART' argv='$SERVER_ARGS' cwd=$REPO port=$APP_PORT"
  print "OK postgres pid=$PG_PID lstart='$PG_LSTART' argv='$PG_ARGS' data=$PG_DATA port=$PG_PORT"
  print "OK revision=$REVISION url=$URL auth=open(no OAuth vars)"
  if [[ -n ${FWD_PID:-} ]]; then
    [[ $(listener $APP_PORT $TS_IP) == $FWD_PID ]] || fail "tailnet $TS_IP:$APP_PORT not owned by forwarder $FWD_PID"
    [[ $(curl -fsS http://$TS_IP:$APP_PORT/version) == $live ]] || fail "tailnet path serves a different instance"
    print "OK forwarder pid=$FWD_PID argv='$FWD_ARGS' preview=http://$(scutil --get LocalHostName | tr A-Z a-z).<tailnet>.ts.net:$APP_PORT ($TS_IP)"
  fi
}

# Validates every recorded identity before stopping anything; any mismatch keeps all state.
teardown() {
  local n rc bad=()
  for n in FWD SERVER PG; do
    owned $n && rc=0 || rc=$?
    (( rc != 2 )) || bad+=("$n pid ${(P)${:-${n}_PID}}")
  done
  if (( $#bad )); then print -u2 "FAIL: recorded PID now belongs to another process (${(j:, :)bad}); stopped nothing, state kept at $RUN"; return 1; fi
  for n in FWD SERVER; do owned $n && kill ${(P)${:-${n}_PID}} || true; done
  if [[ -f $PG_DATA/postmaster.pid ]] && pg_ctl -D $PG_DATA status >/dev/null 2>&1; then pg_ctl -D $PG_DATA -m fast -w stop >/dev/null; fi
  for i in {1..25}; do owned FWD || owned SERVER || owned PG || break; sleep 0.2; done
  for n in FWD SERVER PG; do
    if owned $n; then print -u2 "FAIL: $n pid ${(P)${:-${n}_PID}} still running; state kept at $RUN"; return 1; fi
  done
  rm -rf $RUN
  print "stopped owned processes and removed $RUN"
}

down() {
  [[ ! -L $RUN ]] || fail "$RUN is a symlink; not touching it"
  [[ -r $STATE ]] || { print "no state at $STATE; stopped nothing, removed nothing"; return }
  source $STATE
  teardown
}

case ${1:-} in
  up)
    trap 'rc=$?; if (( rc )) && [[ -n ${UP_OWNS_RUN:-} ]]; then print -u2 "setup failed; rolling back what this run started"; teardown >&2 || print -u2 "rollback incomplete; retry with: verify.sh down"; fi; exit $rc' EXIT
    up ;;
  doctor) load; doctor ;;
  down) down ;;
  cli)
    shift; load; doctor >&2
    # Empty config path and env -i keep the user's ~/.config tokenRef and PLAN_HOST_* out of the run.
    env -i PATH=$SAFE_PATH HOME=$RUN PLAN_HOST_CONFIG=$RUN/no-config.json PLAN_HOST_AUTHOR=verify \
      bun $REPO/bin/html-plan.mjs "$@" --url $URL --token $TOKEN ;;
  psql) load; doctor >&2; psql -h 127.0.0.1 -p $PG_PORT -U verify -d html_plan_host_verify -XAt -c "$2" ;;
  *) print -u2 "usage: verify.sh up|doctor|cli <args>|psql <sql>|down"; exit 2 ;;
esac
