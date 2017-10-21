<?php
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

if (isset($_GET['load'])) {
    $loadRecipe = $_GET['load'];
    echo ('<script type="text/javascript"> loadRecipe = "'.$loadRecipe.'"; </script>'."\n");
}

?>

<!DOCTYPE html>
<html lang="en">

<head>

  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="">
  <meta name="author" content="">

  <title>Auto-Scoring Viewer</title>

  <!-- Bootstrap Core CSS -->
  <link rel="stylesheet" href="../css/bootstrap.min.css">

  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/select2.min.css">
  <link href="https://fonts.googleapis.com/css?family=Ubuntu+Mono" rel="stylesheet">

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
      <a class="navbar-brand" href="#">Auto-Scoring Viewer</a>
    </div>

    <!-- Collect the nav links, forms, and other content for toggling -->
    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
      <ul class="nav navbar-nav">
        <li><a href="/index.php" title="Back to report page">Report</a></li>
        <li><a href="../index.php" title="Back to auto-scoring page">Back to Auto-Scoring</a></li>
        <li><a href="#" title="Start a new debugging session" id="start-debugging">Debug</a></li>
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


    
  <!-- start session button -->
  <div class="container-fluid">
    <div style="overflow: hidden;">
          <div id="left" style="position: absolute; margin: 0px; margin-left: 10px; left: 4px; top: 67px; bottom: 14px; width: 250px; z-index: 0; display: block; overflow-y: scroll; overflow-x: hidden;">
             <div id="left-top" style="position: relative; height: 100px; overflow: hidden;">
                  <div style="background: #313638;">
                    <div class="form-control" style="background: #313638; border: 0px; font-size: 2pt;">
                        <button class="btn btn-interface" id="save-new-recipe" data-toggle="modal" data-target="#save-recipe-dialog">Save As</button>
                        <button class="btn btn-interface" id="create-new-recipe">Clear</button>
                        <button class="btn btn-interface" id="delete-recipe">Delete</button>
                    </div>
                    <div class="form-control" style="background: #313638; border: 0px; margin-top: -10px;">
                         <label for="recipes-list">Load recipe</label>
                         <select id="recipes-list" class="select2" style="width: 100%; background: #313638;"> </select>
                    </div>
                  </div>
             </div>
             <div id="left-up" style="position: relative; height: 730px; overflow: hidden;">
    <center style="border-top: 1px solid grey;">(drag & drop entries &#x21E2)</center>
             </div>
             <div id="left-down"></div>
          </div>
          <div id="right" style="overflow: hidden; position: absolute; left: 270px; top: 67px; bottom: 5px; right: 10px; overflow: scroll; z-index: 0; background: #313638; border: 1px solid gray;">
          <svg id="right_svg" style="display: inline; width: 4000; height: 4000;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">
             <defs>
                <filter id="f1" x="0" y="0" width="200%" height="200%">
                  <feOffset result="offOut" in="SourceAlpha" dx="2" dy="2" />
                  <feGaussianBlur result="blurOut" in="offOut" stdDeviation="3" />
                  <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                </filter>
                <pattern id="basicPattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                   <image href="images/paper.jpg" x="0" y="0" height="200" width="200"/>
                </pattern>
             </defs>
             <rect x="0" y="0" width="4000" height="4000" stroke="none" fill="url(#basicPattern)"></rect>
             <g id="debugging"></g>
             <g id="connects"></g>
          </svg>
      </div>
      <div id="debugging-tools" height="60px;" style="position: absolute; top: 60px; left: 50%; transform: translate(-50%,0%); height: 40px; background: black; padding: 5px; padding-bottom: 5px; border-radius: 3px; border: 1px solid gray;">
        <button type="button" class="btn btn-default" aria-label="Left Align" id="debugging-step-forward">
          <span class="glyphicon glyphicon-large glyphicon-step-forward"></span>
        </button>
        <button type="button" class="btn btn-default" aria-label="Left Align" id="debugging-step-backward">
          <span class="glyphicon glyphicon-step-backward"></span>
        </button>
        <button type="button" class="btn btn-default" aria-label="Left Align" id="debugging-stop">
          <span class="glyphicon glyphicon-stop"></span>
        </button>
        <input type="text" id="deb-epoch" title="Epoch" style="width: 50px;"/>
        <input type="text" id="deb-step" title="Step" style="width: 50px;"/>
      </div>

    </div>
</div>
      <div id="console" style="display: none; background-color: rgba(25,25,25,0.2); position: fixed; bottom: 10px; left: 250px; z-index:2; height: 300px; width: 800px; padding: 5px;">
         <textarea id="console-textarea" style="resize: none; width: 100%; height: 100%; background-color: rgba(25,25,25,0.2); overflow-y:scroll;">Test Text</textarea>
      </div>
    
     <div class="modal fade" role="dialog" id="save-recipe-dialog">
       <div class="modal-dialog">
         <div class="modal-content">
           <div class="modal-header">
             <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
             <h4 class="modal-title">Save Recipe</h4>
           </div>
           <div class="modal-body">
             <p>Provide the name of the instrument</p>
	     <form>
	       <div class="form-group">
		 <label>Name:</label>
		 <input type="text" id="new-name"></input>
	       </div>
	     </form>
             <p>After you save a new reicpe reload the auto-scoring page to see the changes</p>                                                                                                      
           </div>
           <div class="modal-footer">
             <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
             <button type="button" class="btn btn-primary" id="save-recipe-button">Save changes</button>
           </div>
         </div><!-- /.modal-content -->
       </div><!-- /.modal-dialog -->
     </div><!-- /.modal -->

   <div class="modal fade" tabindex="-1" role="dialog" id="wait-dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-body">
    <p>Wait...</p>
          </div>
        </div><!-- /.modal-content -->
      </div><!-- /.modal-dialog -->
    </div><!-- /.modal -->


    <ul class='custom-menu'>
      <!-- <li data-action="first">First thing</li>
      <li data-action="second">Second thing</li>
      <li data-action="third">Third thing</li> -->
    </ul>
    
    
  <!-- Make Screenshots for recipes - works in Chrome only -->
  <canvas style="display: none;" id="canvas" width="800" height="800"></canvas>
  <div id="png-container" style="display: none;"></div>
                                                                                                                         
  <script src="//ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
  <script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js"></script>
  <script src="js/jquery.ui.touch-punch.min.js"></script>  
  <script src='js/moment.min.js'></script>
  <script src='js/typed.min.js'></script>
    <!-- Bootstrap Core JavaScript -->
  <script src="js/bootstrap.min.js"></script>

  <script src="js/select2.full.min.js"></script>
  <script type="text/javascript" src="js/all.js"></script>

</body>

</html>
