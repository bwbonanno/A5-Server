var http = require('http')
	, fs   = require('fs')
	, qs   = require("querystring")
	, url  = require('url')
	, imdb = require('imdb-api')
	, async = require('async')
	, HashMap = require('hashmap')
	, deasync = require('deasync')
	, sqlite  = require('sqlite3')
	, port = 8080

var db = new sqlite.Database('movies');

var movies = [];

db.each("SELECT * FROM movies", function(err, title){
	movies.push(title.title);
}, function(){
	movies = movies.sort();
	movies = movies.map(function(movie){
		return movie = movie + " ";	
	})
	server.listen(process.env.PORT || port)
	console.log('listening on 8080')
});

// Add more movies! (For a technical challenge, use a file, or even an API!)




var server = http.createServer (function (req, res) {

	var uri = url.parse(req.url)

	var data = '';
	var q;


  handleURI(req,res,uri,data);

})  

function handleResBody(req, add, res) {
  var chunk = ""
  req.on('data', function(data) {
    chunk += data;
  })
  req.on('end', function(data) {
    // Note: this is not a great way to access this object.
    var obj = chunk.split('=');
    if (add === true)
      addCallback( obj[1], res);
    else
      deleteCallback(obj[1], res);
  })
}

var info;
var hm = new HashMap();
var index = new HashMap();
function handleURI(req, res, uri, data){
  switch( uri.pathname ) {
      // Note the new case handling search
    case '/search':
      handleSearch(res, uri)
      sendFile(res, "search.html", "text/html");
      break
    case '/':
      sendFile(res, "index.html", "text/html");
      //if(data){ updateMovies(req, res, uri, data) }
      //else { searchSetup(res) };
      break
    case '/add':
      handleResBody(req, true, res);
      break
    case '/delete':
      handleResBody(req, false, res);
      break
    case '/list':
      sendIndex(res);
      break
    case '/index.html':
      searchSetup(res);
      break
    case '/results':
      res.end(JSON.stringify(result_html));
      break
    case '/manage':
      sendFile(res, "manage.html", 'text/html');
      break;
    case '/manage/':
      sendFile(res, "manage.html", 'text/html');
      break
    case '/css/style.css':
      sendFile(res, 'css/style.css', 'text/css')
      break
    case '/node_modules/bootstrap/dist/css/bootstrap.css':
      sendFile(res, 'node_modules/bootstrap/dist/css/bootstrap.css', 'text/css')
      break
    case '/node_modules/bootstrap/dist/css/bootstrap-theme.css':	
      sendFile(res,'node_modules/bootstrap/dist/css/bootstrap-theme.css', 'text/css')
      break;	
    case '/js/scripts.js':
      sendFile(res, 'scripts.js', 'text/javascript')
      break
    case '/README.md':
      sendFile(res, 'README.md', 'text/html');
      break;
    default:
      res.end('404 not found')
  }
}



// subroutines
var html = '';
var info;
var hm = new HashMap();
var index = new HashMap();
var result_html = '';



// subroutines
var html = '';
var count = 0;

function sort(results_sort, results, delta) {
  // Sort Array Based on Values //
  results_sort.sort(function(first, second) {
    if(delta == 1)
    {
      return second[1] - first[1];
    }
    else
    {
      return first[1] - second[1];
    }
  });

  results = results_sort.map(function(subarray) {
    return subarray[0];
  });
  return results;	
}

function firstSort(hashmap, results, delta)
{
  // Make Array out of Dictionary //
  var results_sort = [];
  hashmap.forEach(function(value, key){
    results_sort.push([key, value]);
  });
  return sort(results_sort, results, delta);	
}

function secondSort(hashmap, results, delta)
{
  var results_sort = [];
  results.forEach(function(result) {
    results_sort.push([result, hashmap.get(result)]);
  });
  return sort(results_sort, results, delta);
}, true
function imdbQuery(query_copy)
{
  imdb.getReq({name:query_copy}, function(error, data) {
    if(error)
    {
      console.error("DATA NOT FOUND",query_copy);
      info = "<li class=results'>" + query_copy+ "</li>";
      info = info + "<li class='info'>No Information Found</li>";
    }
    else
    {
      info = "<li class='results'>" + query_copy + "</li>";
      info = info + 
        "<li class='info'>Director: " + data.director + "</li>" + 
        "<li class='info'>Year: " + data._year_data + "</li>" +
        "<li class='info'>Rated: " + data.rated + "</li>" + 
        "<li class='info'>Runtime: " + data.runtime + "</li>" +
        "<li class='info'>Rating: "+ data.rating + "</li>";

      db.run("INSERT INTO movies VALUES ('" + query_copy + "','"+data.rating+"')", function(){
        console.log("Database Query Done");
        movies.push(query_copy+ " ");
        movies = movies.sort();

        data = '';

      });
    }


  });
  while(info === undefined){
    deasync.runLoopOnce();			
  }
  result_html = result_html + info;

}

// You'll be modifying this function
function handleSearch(res, uri) {
  result_html = '';
  info = undefined;
  hm = new HashMap();
  index = new HashMap();
  var contentType = 'text/html'
  res.writeHead(200, {'Content-type': contentType})

  if(uri.query) {
    // PROCESS THIS QUERY TO FILTER MOVIES ARRAY BASED ON THE USER INPUT
    var query = qs.parse(uri.query);
    var query_copy = query.search;
    console.log(query_copy);
    query = query.search.split(" ");
    query = query.map(function(q){
      return q = q + " ";
    });

    var results = [];
    query.forEach(function(q){
      results.push(movies.map(function(movie) {
        var i = movie.toLowerCase().indexOf(q.toLowerCase());
        if(i > -1)
        {
          if(!index.has(movie))
          {
            index.set(movie, i); 						
          }
          return movie;
        }
      }));
    });
    results = results.toString().split(",");


    results.forEach(function(result)
      {
        if(hm.has(result))
        {
          hm.set(result, hm.get(result)+1);
        }	
        else
        {
          hm.set(result, 1);
        }
      });
    results = firstSort(index, results, -1);
    results = secondSort(hm, results, 1);

    count = results.length;

    if (count >= 4)
    {
      result_html = result_html + "<div class='links-div'>";
      result_html = result_html + "<a href='/' class='links'>Search Again</a>";
      result_html = result_html + "</div>";
    }
    result_html = result_html + "<div class='result-div'>";
    result_html = result_html + "<ul class='col'>";

    if(hm.get(results[0]) < query.length)
    {
      imdbQuery(query_copy);
    }
    if (count <= 0)
    {
      imdbQuery(query_copy);
    }
    results.map(function (result){
      var info;

      if(result) {
        imdb.getReq({name:result},function(error, data) {
          if(error)
          {
            info = "<li class=results'>" + result + "</li>";
            info = info + "<li class='info'>No Information Found</li>";
          }
          else
          {
            info = "<li class='results'>" + result + "</li>";
            info = info + 
              "<li class='info'>Director: " + data.director + "</li>" + 
              "<li class='info'>Year: " + data._year_data + "</li>" +
              "<li class='info'>Rating: " + data.rated + "</li>" + 
              "<li class='info'>Runtime: " + data.runtime + "</li>" +
              "<li class='info'>Rating: "+ data.rating + "</li>";

          }

        })
        while(info === undefined){
          deasync.runLoopOnce();			
        }
        result_html = result_html + info;
      };
    })
  }
}

function reqCallback(error, data)
{
  if(error)
  {
    console.error("DATA NOT FOUND",this.result);
    html = html + "<li class=results'>" + this.result + "</li>";
    html = html + "<li class='info'>No Information Found</li>";
    callbackSync(this.res, this.contentType);
  }
  else
  {
    html = html + "<li class='results'>" + this.result + "</li>";
    html = html + 
      "<li class='info'>Director: " + data.director + "</li>" + 
      "<li class='info'>Year: " + data._year_data + "</li>" +
      "<li class='info'>Rating: " + data.rated + "</li>" + 
      "<li class='info'>Runtime: " + data.runtime + "</li>";
    callbackSync(this.res, this.contentType);
  }
}

function completeHTML(res, contentType){
  html = html + "</ul>";
  html = html + "</div>";

  html = html + "<div class='links-div'>";
  html = html + "<a href='/' class='links'>Search Again</a>";
  html = html + "</div>";

  html = html + "</body>";
  html = html + "</html>";


  res.writeHead(200, {'Content-type': contentType})
  res.end(html, 'utf-8')
}

function updateMovies(req, res, uri, data){
  q = qs.parse(data);
  var title = q.title;

  db.run("INSERT INTO movies VALUES ('" + title + "', 5)", function(){
    movies.push(title);
    sendIndex(res);

  });
}

function addCallback(post, res){

  db.get("SELECT * FROM movies WHERE title='"+post+"'", function(error,row){
    if(row === undefined){

      imdb.getReq({name:post}, function(error, data) {
        if(error)
        {
          console.error("DATA NOT FOUND",post);
          /*	info = "<li class=results'>" + query_copy+ "</li>";
      info = info + "<li class='info'>No Information Found</li>";
      */
        }
        else
        {
          db.exec("INSERT INTO movies VALUES ('" + data.title + "','"+data.rating+"')", function(){
            movies.push(data.title+ " ");
            movies = movies.sort();

            data = '';
            console.log("CALLBACK");
            sendIndex(res);

          });
        }

      })
    }
  });
}

function deleteCallback(post,res){
  db.get("SELECT * FROM movies WHERE title='"+post+"'", function(error,row){
    if(row === undefined){
      return;
    }
    else{
      db.run("DELETE FROM movies WHERE title='"+post+"'", function(){
        console.log("DELETED");

        var index = movies.indexOf(post+" ");
        movies.splice(index,1);
        data = '';
        sendIndex(res);
      });
    }
  });
}



function searchSetup(res){
  html = '';

  html = html + '<html>'

  html = html + '<head>'
  // You could add a CSS and/or js call here...
  html = html + '<link href="https://fonts.googleapis.com/css?family=Josefin+Slab|Open+Sans+Condensed:300" rel="stylesheet"> '
  html = html + "<link href='node_modules/bootstrap/dist/css/bootstrap.css' rel='stylesheet'>";
  html = html + "<link href='node_modules/bootstrap/dist/css/bootstrap-theme.css' rel='stylesheet'>"
  html = html + "<link rel='stylesheet' type='text/css' href='/css/style.css'/>";

  html = html + "<title>Movie Search!</title>";
  html = html + '</head>'

  html = html + '<body>'
  html = html + "<div class='header'>";
  html = html + '<h1 id="header-text">Movie Search!</h1>'
  html = html + "</div>"

  // Here's where we build the form YOU HAVE STUFF TO CHANGE HERE
  html = html + '<form action="search" method="get" class="search">'
  html = html + '<input type="String" name="search" />'
  html = html + '<button type="submit">Search</button>'
  html = html + '</form>'

  sendIndex(res, html);


}

// Note: consider this your "index.html" for this assignment
function sendIndex(res) {
  var contentType = 'text/html'


  //html = html + '<div class="col">'
  // Note: the next line is fairly complex. 
  // You don't need to understand it to complete the assignment,
  // but the `map` function and `join` functions are VERY useful for working
  // with arrays, so I encourage you to tinker with the line below
  // and read up on the functions it uses.
  //
  // For a challenge, try rewriting this function to take the filtered movies list as a parameter, to avoid changing to a page that lists only movies.


  async.map(movies, function(d, callback) {
    if(d == "Juno ")
      console.log("JUNO")


    db.get("SELECT * FROM movies WHERE title='"+d.substring(0,d.length-1)+"'", function(error, rating){

      if(rating){

        var info = '';
        info = info + "<a href='/search?search="+d+"'>";
        info = info + "<div class=panel panel-default'>";
        info = info + "<div class='panel-heading'>";
        info = info + "<h3 class='panel-title'>";
        info = info + d;
        info = info + "</h3>";
        info = info + "</div>";
        info = info + "<div class='panel-body'>";
        info = info + "Rating: " + rating.rating; 
        info = info + "</div>";
        info = info + '</div>'
        info = info + '</a>';
        callback(null, info); 
      }
    })}, function(error, results){
      console.log("All Done!");
      results = results.join(' ');

      res.end(JSON.stringify(results))
    })
}

function sendFile(res, filename, contentType) {
  contentType = contentType || 'text/html';

  fs.readFile(filename, function(error, content) {
    res.writeHead(200, {'Content-type': contentType})
    res.end(content, 'utf-8')
  })

}
