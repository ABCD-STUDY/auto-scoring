<?php

$action = "get";
if (isset($_GET['action'])) {
    $action = $_GET['action'];
}

if ($action == "get") {
    $data = json_decode(file_get_contents('timing.json'), true);
    $value = "";
    if (isset($_GET['value'])) {
        $value = $_GET['value'];
        $result = array();
        foreach($data as $dat) {
            if ($dat['recipe'] == $value)
                $result[] = $dat;
        }
        $data = $result;
    }
    echo(json_encode($data));
} else if ($action == "save") {
    $data = json_decode(file_get_contents('timing.json'), true);
    $measure = "";
    if (isset($_GET['measure'])) {
        $measure = $_GET['measure'];
    }
    $active = "";
    $group  = "";
    $order  = "";
    if (isset($_GET['active'])) {
        $active = $_GET['active'];
        if ($active == "Yes") {
            $active = 1;
        } else {
            $active = 0;
        }
    }
    if (isset($_GET['group'])) {
        $group = $_GET['group'];
    }
    if (isset($_GET['order'])) {
        $order = $_GET['order'];
    }
    $found = false;
    foreach ($data as &$dat ) {
        if ($dat['recipe'] == $measure) {
            $found = true;
            $dat['recipe'] = $measure;
            $dat['group']  = $group;
            $dat['order']  = $order;
            $dat['active'] = $active;
        }
    }
    if ($found == false) {
        $data[] = array( 'recipe' => $measure, 'active' => $active, 'group' => $group, 'order' => $order );
    }
    //syslog(LOG_EMERG, "save timing again");
    file_put_contents('timing.json', json_encode($data));
} else if ($action == "oncePretend") {
    // have this recipe run once
    $measure = "";
    if (isset($_GET['measure'])) {
        $measure = $_GET['measure'];
    } else {
        echo ("{ \"message\": \"Error: no recipe specified\" }");
        return;
    }
    $data = json_decode(file_get_contents('timing.json'), true);
    $found = false;
    foreach ($data as &$dat ) {
        if ($dat['recipe'] == $measure) {
            $found = true;
            $dat['oncePretend'] = 1;
        }
    }
    if ($found == false) {
        echo ("{ \"message\": \"Error: this recipe does not exist (".$measure.")\" }");
        return;       
    }
    file_put_contents('timing.json', json_encode($data));
    echo ("{ \"message\": \"Ok\" }");
    return;
} else if ($action == "once") {
    // have this recipe run once
    $measure = "";
    if (isset($_GET['measure'])) {
        $measure = $_GET['measure'];
    } else {
        echo ("{ \"message\": \"Error: no recipe specified\" }");
        return;
    }
    $data = json_decode(file_get_contents('timing.json'), true);
    $found = false;
    foreach ($data as &$dat ) {
        if ($dat['recipe'] == $measure) {
            $found = true;
            $dat['once'] = 1;
        }
    }
    if ($found == false) {
        echo ("{ \"message\": \"Error: this recipe does not exist (".$measure.")\" }");
        return;       
    }
    file_put_contents('timing.json', json_encode($data));
    echo ("{ \"message\": \"Ok\" }");
    return;
}

?>
