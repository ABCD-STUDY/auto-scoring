#!/usr/bin/env bash
#
# run the auto-scoring scripts that are enabled (by group)
#
# 0 0 * * * [[ `ps -ef|grep -v grep|grep cronjob.sh` -eq 0 ]] && /var/www/html/applications/auto-scoring/cronjob.sh >> /var/www/html/applications/auto-scoring/cronjob.log 2>&1
#

# individual log files will be written to /var/www/html/logs/auto_scoring_{}.log
log="/var/www/html/applications/auto-scoring/cronjob.log"

# we should be the processing user
actives=`jq '[.[]|select(.active==1)|select(.group=="")]' /var/www/html/applications/auto-scoring/timing.json`
runsingle=`echo $actives | jq ".[].recipe"`
/usr/bin/curl "https://abcd-report.ucsd.edu/applications/tick-tock/getData.php?action=tick&what=AutoScoring"

groups=`jq -r '[.[]|select(.active==1)|select(.group!="")|.group]|unique|.[]' /var/www/html/applications/auto-scoring/timing.json`
d=`pwd`
while read -r line; do
    echo "Process group: $line"
    group=`jq -r --arg line "$line" '[.[]|select(.active==1)|select(.group==$line)]|sort_by(.order|tonumber)|.[].recipe' /var/www/html/applications/auto-scoring/timing.json`
    # now execute each recipe in order (slow but should work)
    echo "`date`: start processing" >> $log
    cd /var/www/html/applications/auto-scoring/runner
    while read -r line2; do
        echo "`date`: group run for group $line, running ${line2} now..." >> $log 
        ./runner.js run ../viewer/recipes/${line2}.json > /var/www/html/logs/auto_scoring_${line2}.log 2>&1
    done <<< "$group"
    cd "$d"
done <<< "$groups"

echo "`date`: start processing" >> $log
cd /var/www/html/applications/auto-scoring/runner
parallel --max-procs 2 -j2 bash -c 'cd /var/www/html/applications/auto-scoring/runner; /usr/bin/curl "https://abcd-report.ucsd.edu/applications/tick-tock/getData.php?action=tick&what=AutoScoring"; fn=$(echo {} | tr -d "\""); ./runner.js run ../viewer/recipes/${fn}.json > /var/www/html/logs/auto_scoring_${fn}.log 2>&1' ::: $runsingle >> $log 2>&1 & 
echo "`date`: done single jobs" >> $log
cd "$d"
