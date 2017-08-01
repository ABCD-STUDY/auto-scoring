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
$name = "";
if (isset($_GET['name'])) {
    $name = $_GET['name'];
}

$state = "";
if (isset($_POST['state'])) {
    $state = json_decode(urldecode($_POST['state']), true);
}

if ($action == "save") {
    if (!in_array("can-auto-score",$permissions)) {
        echo("{ \"message\": \"permissions denied\" }");
        return;
    }
    
    // save the state
    echo ("got save action with: \"".$name . "\" and values: " .json_encode($state));
    if ($name !== "" && $state !== "") {
        // create a dictionary that contains information about user, date, etc.
        $envelope = array();
        $envelope['lastSavedByUserName'] = $user_name;
        $email = getEmailFromUserName( $user_name );
        $envelope['lastSavedByUserEmail'] = $email;
        $envelope['lastSaveAtDate']  = date(DATE_ATOM);
        $envelope = array( $envelope );
        // get envelope from before (if it exists)
        if (file_exists('recipes/' . $name . '.json')) {
           $previousState = json_decode(file_get_contents('recipes/' . $name . '.json'),TRUE);
           if (isset($previousState['envelope'])) {
               $envelope = array_merge( $envelope, $previousState['envelope']);
           }
        }
        $state['envelope'] = $envelope;
        // now save the state
        file_put_contents('recipes/' . $name . '.json', json_encode($state));
    }
    return;
} elseif ($action == "saveImage") {
    if (!in_array("can-auto-score",$permissions)) {
        echo("{ \"message\": \"permissions denied\" }");
        return;
    }

    if ($name !== "") {
        if (isset($_POST['imageData'])) {
            $imageData = urldecode($_POST['imageData']);
            $imageData = base64_decode($imageData);
            file_put_contents('recipes/' . $name, $imageData);
        } else {
            echo("No imageData found");
        }
    }
} elseif ($action == "delete") {
    if (!in_array("can-auto-score",$permissions)) {
        echo("{ \"message\": \"permissions denied\" }");
        return;
    }

    if (is_file("recipes/".$name.".json")) {
        unlink("recipes/".$name.".json");
        unlink("recipes/".$name.".png");
        echo ("{ \"message\": \"File deleted.\" }");
    } else {
        echo("{ \"message\": \"File could not be deleted.\" }");
    }
} else {
    if (!in_array("can-view-auto-score",$permissions) && !in_array("can-auto-score",$permissions)) {
        echo("{ \"message\": \"permissions denied\" }");
        return;
    }

    $files = glob('recipes/*.json');
    $res = array();
    foreach($files as $file) {
        $path_parts = pathinfo($file);
        $res[$path_parts['filename']] = json_decode(file_get_contents($file), true);
    }
    
    echo(json_encode($res));
}

?>
