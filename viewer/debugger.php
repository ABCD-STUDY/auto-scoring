<?php
session_start();

include($_SERVER["DOCUMENT_ROOT"]."/code/php/AC.php");
$user_name = check_logged(); /// function checks if visitor is logged.
$admin = false;

if ($user_name == "") {
    return;
}

$permissions = list_permissions_for_user( $user_name );

$action = "";
if (isset($_GET['action'])) {
    $action = $_GET['action'];
}

$config = json_decode(file_get_contents('debugger_config.json'), true);

$data = 'debugging-data';
if (!is_dir($data)) {
    mkdir($data, 0700);
    if (!is_dir($data)) {
        echo( json_encode( array( "message" => "could not create directory ".$data ) ) );
        return;
    }
}

if ($action == "start") {
    // start debugging is the same as creating a directory to store the debugging files
    if (!in_array("can-auto-score",$permissions)) {
        echo("{ \"message\": \"permissions denied\" }");
        return;
    }
    
    // create a unique key for this debugging state
    $key = uniqid('', true);
    $d = $data.'/'.$key."_".$user_name;
    mkdir($d, 0700);
    if (!is_dir($d)) {
        echo( json_encode( array( "message" => "permissions denied, could not create key directory" ) ) );
        return;
    }
    echo( json_encode( array( "key" => $key ) ) );
    return;
} else if($action == "step") {
    $numSteps = 1;
    if (isset($_GET['numSteps'])) {
        $numSteps = intval($_GET['numSteps']);
    }
    if ($numSteps < 1) {
        // do nothing
        return;
    }
    $key = "";
    if (isset($_GET['key'])) {
        $key = $_GET['key'];
    }
    $recipe = "";
    if (isset($_GET['recipe'])) {
        $recipe = $_GET['recipe'];
    }
    if ($recipe == "") {
        echo( json_encode( array( "message" => "Error: no recipe given" ) ) );
        return;
    }
    $kdir = $data.'/'.$key."_".$user_name;
    if (!isset($kdir)) {
        echo( json_encode( array( "message" => "Error: this debugging key does not exist" ) ) );
        return;
    }

    // how many lines are there in the current history file?
    $file=$kdir.'/history.txt';
    $linecount = 0;
    if (is_file($file)) {
        $fp = fopen($file, "r");
        if ($fp !== FALSE) {
            while(!feof($fp)) {
                $line = fgets($fp);
                $linecount++;
            }
            fclose($fp);
        }
    }
    
    // execute this number of steps by calling
    $cmd = $config['exec_path']. " run -h " . $kdir.'/history.txt'. ' -d '.$kdir.'/state.json'.' -s '.$numSteps.' recipes/'.$recipe.".json";
    $res = exec($cmd);
    
    // after this step we have that number of steps done
    // lets get the lines from the history file that contain the step information
    $ret = [];
    $lc = 0;
    if (is_file($file)) {
        $fp = fopen($file, "r");
        if ($fp === FALSE) {
            echo( json_encode( array( "message" => "Error: could not read the history file", "result" => "[]" ) ) );
            return;
        }
        while(!feof($fp)) {
            $line = fgets($fp);
            if (strlen($line) > 0) {
                $lc++;
                if ($lc > $linecount) {
                    $va = json_decode($line,true);
                    $va['line'] = $lc;
                    $ret[] = $va;
                }
            }
        }
        fclose($fp);
    }
    echo( json_encode( array( "message" => "Ok: ".$res, "result" => $ret ) ) );
    return;
} else if ($action == "stop") {
    // we can clean up the directory now
    $key = "";
    if (isset($_GET['key'])) {
        $key = $_GET['key'];
    }
    if ($key === "") {
        echo( json_encode( array( "message" => "Error: no key given." ) ) );
        return;
    }
    $d = $data.'/'.$key."_".$user_name;
    if (!is_dir($d)) {
        echo( json_encode( array( "message" => "Error: This debugging session does not exist" ) ) );
        return;
    }
    // secure this better - resolve links check if it starts with data path
    unlink($d.'/history.txt');
    unlink($d.'/state.json');
} else {
    echo("{ \"message\": \"what do you want?\" }");
    return;
}

?>
