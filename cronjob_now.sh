#!/usr/bin/env bash
#
# run the auto-scoring scripts that are enabled (by group)
#
# */1 * * * * [[ `ps -ef|grep -v grep|grep cronjob_now.sh` -eq 0 ]] && /var/www/html/applications/auto-scoring/cronjob_now.sh >> /var/www/html/applications/auto-scoring/cronjob.log 2>&1
#

# individual log files will be written to /var/www/html/logs/auto_scoring_{}.log
log="/var/www/html/applications/auto-scoring/cronjob.log"

# we should be the processing user

activesPretend=`jq '[.[]|select(.oncePretend==1)]' /var/www/html/applications/auto-scoring/timing.json`
actives=`jq '[.[]|select(.once==1)]' /var/www/html/applications/auto-scoring/timing.json`
# only do something if something needs to be done
if [ "$activesPretend" == "[]" ] && [ "$actives" == "[]" ]; then
    echo  "nothing to be done"
    exit
fi


# remove once flag again
tmpfile=$(mktemp /tmp/cronjob_now.XXXXXX)
jq "[.[]|del(.oncePretend)]" /var/www/html/applications/auto-scoring/timing.json > ${tmpfile} && mv ${tmpfile} /var/www/html/applications/auto-scoring/timing.json && chmod gou+rw /var/www/html/applications/auto-scoring/timing.json
jq "[.[]|del(.once)]" /var/www/html/applications/auto-scoring/timing.json > ${tmpfile} && mv ${tmpfile} /var/www/html/applications/auto-scoring/timing.json && chmod gou+rw /var/www/html/applications/auto-scoring/timing.json
runsingle=`echo $activesPretend | jq ".[].recipe"`
runsingle2=`echo $actives | jq ".[].recipe"`
#/usr/bin/curl "https://abcd-report.ucsd.edu/applications/tick-tock/getData.php?action=tick&what=AutoScoring"

d=`pwd`
echo "`date`: start processing (actives: $runsingle2, pretend: $runsingle)" >> $log
echo "`date`: start processing (actives: $runsingle2, pretend: $runsingle)"
cd /var/www/html/applications/auto-scoring/runner
parallel --max-procs 4 -j4 bash -c 'cd /var/www/html/applications/auto-scoring/runner; /usr/bin/curl "https://abcd-report.ucsd.edu/applications/tick-tock/getData.php?action=tick&what=AutoScoring"; fn=$(echo {} | tr -d "\""); ./runner.js run --pretend ../viewer/recipes/${fn}.json > /var/www/html/logs/auto_scoring_${fn}.log 2>&1' ::: $runsingle >> $log 2>&1
parallel --max-procs 4 -j4 bash -c 'cd /var/www/html/applications/auto-scoring/runner; /usr/bin/curl "https://abcd-report.ucsd.edu/applications/tick-tock/getData.php?action=tick&what=AutoScoring"; fn=$(echo {} | tr -d "\""); ./runner.js run ../viewer/recipes/${fn}.json > /var/www/html/logs/auto_scoring_${fn}.log 2>&1' ::: $runsingle2 >> $log 2>&1
echo "`date`: done single jobs" >> $log
cd "$d"
