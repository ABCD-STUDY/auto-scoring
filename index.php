<?php
//
// This first part is for authentication purposes (see github.com/ABCD-STUDY/FIONASITE/php/AC.php).
//
  session_start();

  include($_SERVER["DOCUMENT_ROOT"]."/code/php/AC.php");
  $user_name = check_logged(); /// function checks if visitor is logged.
  $admin = false;

  if ($user_name == "") {
    // user is not logged in
    return;
  } else {
    if ($user_name == "admin")
      $admin = true;
    echo('<script type="text/javascript"> user_name = "'.$user_name.'"; </script>'."\n");
    echo('<script type="text/javascript"> admin = '.($admin?"true":"false").'; </script>'."\n");
  }
  
  $permissions = list_permissions_for_user( $user_name );

  // find the first permission that corresponds to a site
  // Assumption here is that a user can only add assessment for the first site he has permissions for!
  $sites = [];
  foreach ($permissions as $per) {
     $a = explode("Site", $per); // permissions should be structured as "Site<site name>"

     if (count($a) > 1 && $a[1] != "" && !in_array($a[1], $sites)) {
        $sites[] = $a[1];
     }
  }

//
// Start here for page specific code.
//
$recipes = glob('viewer/recipes/*.json');
echo('<script type="text/javascript"> recipes = [');
foreach($recipes as $recipe) {
    // read this recipe
    $state = json_decode(file_get_contents($recipe),TRUE);
    $pathparts = pathinfo($recipe);
    $data = array( 'name' => $pathparts['filename'] );
    if (isset($state['envelope'])) {
        $data['envelope'] = $state['envelope'];
    }
    echo(json_encode($data).',');
}
echo(']; </script>');

?>

<!DOCTYPE html>
<html lang="en">

<head>

  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="">
  <meta name="author" content="">

  <title>Auto-Scoring</title>

  <!-- Bootstrap Core CSS -->
  <link rel="stylesheet" href="css/bootstrap.min.css">
  <link rel="stylesheet" href="css/style.css">

</head>

<body>
  <nav class="navbar navbar-default">
  <div class="container-fluid">
    <!-- Brand and toggle get grouped for better mobile display -->
    <div class="navbar-header">
      <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
        <span class="sr-only">Toggle navigation</span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
      </button>
      <a class="navbar-brand" href="#">Auto-Scoring</a>
    </div>

    <!-- Collect the nav links, forms, and other content for toggling -->
    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
      <ul class="nav navbar-nav">
        <li><a href="/index.php" title="Back to report page">Report</a></li>
      </ul>
      <ul class="nav navbar-nav navbar-right">
        <li class="dropdown">
          <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><span id="session-active">User</span> <span class="caret"></span></a>
          <ul class="dropdown-menu">
            <li><a href="#" onclick="closeSession();">Close Session</a></li>
            <li><a href="#" onclick="logout();">Logout</a></li>
          </ul>
        </li>
      </ul>
    </div><!-- /.navbar-collapse -->
  </div><!-- /.container-fluid -->
</nav>

    <div class="container-fluid">
      <div class="row-fluid">
         <p>Derived scores are calculated once every night for all data in the ABCD electronic data repository. The list below contains the scoring algorithms used in each case.</p>
      </div>
      <div id="recipes" class="row-fluid">
      </div>      
    </div>


    <div class="container-fluid">
       <div class="row-fluid">
    <hr>
    <p><i>A service provided by the Data Analysis and Informatics Core of the ABCD study. Source-code is available on github.com/ABCD-STUDY/auto-scoring.</i></p>
       </div>
    </div>
    
  <script src="//ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
  <script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js"></script>
  <!-- Bootstrap Core JavaScript -->
  <script src="js/bootstrap.min.js"></script>

  <script type="text/javascript">
      jQuery(document).ready(function() {
          for (var i = 0; i < recipes.length; i++) {
              d = '';
              if (typeof recipes[i]['envelope'] !== 'undefined' && recipes[i]['envelope'].length > 0) {
                  d = recipes[i]['envelope'][0]['lastSavedByUserName'];
              }
              dat = '';
              if (typeof recipes[i]['envelope'] !== 'undefined' && recipes[i]['envelope'].length > 0 && typeof recipes[i]['envelope'][0]['lastSaveAtDate'] !== 'undefined') {
                  dat = '[' + recipes[i]['envelope'][0]['lastSaveAtDate'].slice(0,10) + ']';
              }
              jQuery('#recipes').append('<div class="panel panel-default block" recipe="'+ recipes[i]['name'] + '"><div class="panel-heading"><span class="recipe-counter">Recipe ' + i + '</span><span class="recipe-date pull-right">'+ dat +'</span></div>' + '<div class="panel-body image_container">' + '<img class="image" src="viewer/recipes/' + recipes[i]['name'] + '.png"/>' + '<div class="edit-icon"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></div>' + '</div>' + '<div class="panel-footer"><span class="recipe-name">'+ recipes[i]['name'] +'</span><span class="recipe-user-name pull-right">' + d + '</span></div>' +  '</div>');
          }
      });

      jQuery('body').on('click', '.edit-icon', function() {
          var recipe = jQuery(this).parent().parent().attr('recipe');
          window.open('viewer/index.php?load=' + recipe, '_viewer');
      });
  </script>


</body>

</html>
