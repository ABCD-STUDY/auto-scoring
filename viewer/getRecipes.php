<?php

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
    // save the state
    echo ("got save action with: \"".$name . "\" and values: " .json_encode($state));
    if ($name !== "" && $state !== "") {
        // now save the state
        file_put_contents('recipes/' . $name . '.json', json_encode($state));
    }
    return;
} elseif ($action == "saveImage") {
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
    if (is_file("recipes/".$name.".json")) {
        unlink("recipes/".$name.".json");
        unlink("recipes/".$name.".png");
        echo ("{ \"message\": \"File deleted.\" }");
    } else {
        echo("{ \"message\": \"File could not be deleted.\" }");
    }
} else {

    $files = glob('recipes/*.json');
    $res = array();
    foreach($files as $file) {
        $path_parts = pathinfo($file);
        $res[$path_parts['filename']] = json_decode(file_get_contents($file), true);
    }
    
    echo(json_encode($res));
}

?>
