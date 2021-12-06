<?php

$action = "list";
if (isset($_GET['action'])) {
    $action = $_GET['action'];
}

// return something like
$erg = array(array( "1wps_ss_sum", "Fri, 02 Jul 2021 17:28:39-0700"));
echo(json_encode($erg));


?>