#!/usr/bin/env bash
#
# run the auto-scoring scripts that are enabled (by group)
#
# 0 0 * * * [[ `ps -ef|grep -v grep|grep cronjob.sh` -eq 0 ]] && /var/www/html/applications/auto-scoring/cronjob.sh >> /var/www/html/applications/auto-scoring/cronjob.log 2>&1
#

# individual log files will be written to /var/www/html/logs/auto_scoring_{}.log
log="/var/www/html/applications/auto-scoring/cronjob.log"

# we should be the processing user
stopthese=`jq '[.[]|select(.stop==1)]' /var/www/html/applications/auto-scoring/timing.json | jq -r ".[].recipe"`

# stop processing for some recipes
while read -r line; do
    if [ ! -z ${line} ]; then
        # stop this recipe - if its running
        echo "`date`: stop a recipe if its still running..." >> $log
        # echo "kill $(ps aux | grep \"nodejs ./runner.js [r]un .*${line}.json\" | awk '{print $2}')" >> $log
        # echo ${line} >> $log
        echo  "kill job for ${line}" >> $log
        kill $(ps aux | grep "nodejs ./runner.js [r]un.*${line}" | awk '{print $2}')
        # remove the stop tag again
        tmpfile=$(mktemp /tmp/cronjob_now.XXXXXX)
        jq "[.[]|del(.stop)]" /var/www/html/applications/auto-scoring/timing.json > ${tmpfile} && mv ${tmpfile} /var/www/html/applications/auto-scoring/timing.json && chmod gou+rw /var/www/html/applications/auto-scoring/timing.json
    fi
done <<< "$stopthese"

