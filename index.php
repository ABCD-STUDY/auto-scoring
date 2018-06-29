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
        <li>
    <form class="navbar-form navbar-left" role="search">
       <div class="form-group">
           <input type="text" class="form-control" placeholder="Search" id="search-field">
       </div>
    </form>
        </li>
    
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
         <p>Derived scores are calculated once every week for all data in the ABCD electronic data repository. The list below contains the scoring algorithms used in each case.</p>
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


    <div class="modal fade" id="edit-timing">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Runtime options for <span class="active-recipe"></span></h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close" style="position: absolute; top: 15px; right: 20px;">
    <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">

        <p>During debugging you may run a recipe a single time. No values will be exported to REDCap but a log file with the expected changes will be created. The execution time depends on the recipe and varies between several minutes and 2h.</p>
        <button id="run-debug-recipe-pretend" class="btn btn-primary" data-dismiss="modal">Run recipe now (debug)</button>
        <button id="run-debug-recipe" class="btn btn-warning" data-dismiss="modal">Run recipe now (change data)</button>
        <hr>
          
            <p>Enable or disable a recipe. Enabled recipes will be execute once every week (Tuesdays).</p>
    <form>
    <div class="form-group">
       <label for="active">Enable this recipe?</label>
       <select class="form-control" id="active">
          <option value="No">No</option>
          <option value="Yes">Yes</option>
       </select>
    </div>
    <hr>
    <p>If a recipe belongs to a group it will be executed together with the other recipes of the same group - in the order given in "Order of execution".</p>
    <div class="form-group">
       <label for="Group">Group (clear entry to disable)</label>
       <input id="group" class="form-control" placeholder="none"/>
    </div>
    <div class="form-group">
       <label for="order">Order of execution</label>
       <select class="form-control" id="order">
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8</option>
       </select>
    </div>
    </form>
    
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" data-dismiss="modal" id="save-timing">Save</button>
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <div class="loader"></div>

    
  <script src="//ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
  <script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js"></script>
  <script src="js/jquery.ui.touch-punch.min.js"></script>  
  <script src="js/geopattern-1.2.3.min.js"></script>
    
  <!-- Bootstrap Core JavaScript -->
  <script src="js/bootstrap.min.js"></script>

  <script type="text/javascript">
   function visibleInViewport( t ) {
       var elementTop = $(t).offset().top;
       var elementBottom = elementTop + $(t).outerHeight();
       var viewportTop = $(window).scrollTop();
       var viewportBottom = viewportTop + $(window).height();
       return elementBottom > viewportTop && elementTop < viewportBottom;
   }


   function download(filename, text) {
       var element = document.createElement('a');
       element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
       element.setAttribute('download', filename);
       
       element.style.display = 'none';
       document.body.appendChild(element);
       
       element.click();
       
       document.body.removeChild(element);
   }
   
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
           jQuery('#recipes').append('<div class="panel panel-default block" recipe="'+ recipes[i]['name'] + '"><div class="panel-heading"><span class="recipe-counter">Recipe ' + i + '</span><span class="recipe-date pull-right">'+ dat +'</span></div>' + '<div class="panel-body image_container geopattern" author="'+d+'">' + '<img class="image" src="viewer/recipes/' + recipes[i]['name'] + '.png" onerror="this.style.display=\'none\'"/>' + '<div class="edit-icon"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></div>' + '</div>' + '<div class="panel-footer"><span class="recipe-name">'+ recipes[i]['name'] +'</span><span class="recipe-user-name pull-right">' + d + '</span></div>' + "<div class='timing'>+</div>" + '</div>');

       }
       jQuery.getJSON('getLog.php', { 'action': "list" }, function(data) {
           // get a list of files with a log
           for (var i = 0; i < data.length; i++) {
               var name = data[i][0];
               var ctime = new Date(Date.parse(data[i][1]));
               var datediff = Math.floor((Math.abs(new Date() - ctime)/1000)/60);
               var logClass = "log";
               var te = "log";
               if (datediff < 5) {
                   logClass = logClass + " log-active";
                   te = "log running";
               }
               jQuery('#recipes').find("div[recipe='" + name + "']").append("<div class=\""+logClass+"\">" + te + "</div>");
           }
       });

       jQuery('#recipes').on('click', '.log', function() {
           // see the log file for
           var t = jQuery(this).parent().attr('recipe');
           jQuery('.loader').show();
           jQuery.get('getLog.php', { 'action': 'get', 'log': t }, function(data) {
               download(t+".log", data);
               setTimeout(function() { jQuery('.loader').hide(); }, 1000);
           });
       });
       
       jQuery('.geopattern').each(function() {
           jQuery(this).geopattern(jQuery(this).attr('author'));
       });
       
       jQuery('#search-field').on('keyup', function(e) {
           var t = jQuery('#search-field').val();
           console.log("search now:" + t);
           jQuery('#recipes').children().each(function(i,d) {
               var pat = new RegExp(t,'i');
               var tt = jQuery(d).text();
               if (tt.match(pat)) {
                   jQuery(d).show();
               } else {
                   jQuery(d).hide();
               }
               //console.log(jQuery(d).text());
           });
       });
       
       jQuery.getJSON('getTiming.php', function(data) {
           for (var i = 0; i < data.length; i++) {
               dat = data[i];
               jQuery('#recipes').children().each(function(i,d) {
                   var rec = jQuery(d).attr('recipe');
                   if (rec == dat['recipe']) {
                       // add the visual representation of the timing value
                       jQuery(d).find('.timing').html((dat['active'] == 1?"Active":"Disabled") + (dat['group']==""?"":" [Group:" + dat['group'] + " Order: " + dat['order'] + "]"));
                   }
               });
           }
       });
       
       jQuery('#recipes').on('click', '.timing', function() {
           console.log("click on +");
           var t = jQuery(this).parent().attr('recipe');
           jQuery('.active-recipe').text(t);
           jQuery('#save-timing').attr('measure', t);
           jQuery('#run-debug-recipe').attr('measure', t);
           jQuery('#run-debug-recipe-pretend').attr('measure', t);
           jQuery('#edit-timing').modal('show');
           // get the values for this measure and show them
           jQuery.getJSON('getTiming.php', { "action": "get", "value": t }, function(data) {
               data = data[0];
               jQuery('#active').val(data['active'] == 1?"Yes":"No");
               jQuery('#group').val(data['group']);
               jQuery('#order').val(data['order']);
           });
       });
       
       jQuery('#save-timing').on('click', function() {
           var measure = jQuery(this).attr('measure');
           var active = jQuery('#active').val();
           var group = jQuery('#group').val();
           var order = jQuery('#order').val();
           console.log("Save the new setting: " + active + " " + group + " " + order);
           jQuery.getJSON('getTiming.php', { "action": "save",
                                             "active": active,
                                             "group": group,
                                             "order": order,
                                             "measure": measure }, function(data) {
                                                 console.log("got back: " + data);
                                             });
       });

       jQuery('#run-debug-recipe').on('click', function() {
           var measure = jQuery(this).attr('measure');
           jQuery.getJSON('getTiming.php', { "action": "once",
                                             "measure": measure }, function(data) {
                                                 console.log("got back: " + data);
                                             });
       });
       jQuery('#run-debug-recipe-pretend').on('click', function() {
           var measure = jQuery(this).attr('measure');
           jQuery.getJSON('getTiming.php', { "action": "oncePretend",
                                             "measure": measure }, function(data) {
                                                 console.log("got back: " + data);
                                             });
       });

   });
   
   jQuery('body').on('click', '.edit-icon', function() {
       var recipe = jQuery(this).parent().parent().attr('recipe');
       window.open('viewer/index.php?load=' + recipe, '_viewer');
   });
   jQuery('body').on('touchend', '.edit-icon', function() {
       var recipe = jQuery(this).parent().parent().attr('recipe');
       window.open('viewer/index.php?load=' + recipe, '_viewer');
   });
  </script>
  

</body>

</html>
