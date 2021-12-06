<?php

$action = "list";
if (isset($_GET['action'])) {
    $action = $_GET['action'];
}
$log = "";
if (isset($_GET['log'])) {
    $what = $_GET['log'];
}

if ($action == "list") {
   // get all files from /var/www/html/logs/
   $files = glob("/var/www/html/logs/auto_scoring_*.log");
   $erg = array();
   foreach ( $files as $filename) {
      //syslog(LOG_EMERG, "HI". $filename);
      $time = filemtime($filename);
      $type = str_replace("/var/www/html/logs/auto_scoring_", "", $filename);
      $type = str_replace(".log", "", $type);
      $erg[] = array($type, $time);
   }

  // return something like
  // $erg = array(array( "1wps_ss_sum", "Fri, 02 Jul 2021 17:28:39-0700"));
  echo(json_encode($erg));
} else if ($action == "get") {
  // use what to return the log for that score
  // we expect a name like this:
  $fname = "/var/www/html/logs/auto_scoring_".$log.".log";
  echo(file_get_contents($fname));

}

?>