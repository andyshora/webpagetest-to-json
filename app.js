var express = require('express')
config = require('./lib/config')
RestClient = require('node-rest-client').Client,
Q = require('q'),
jf = require('jsonfile');

var app = express();
var restClient = new RestClient();

var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/views/index.html');
});

var currentTestId = null;

function cleanup() {
  currentTestId = null;
}

function initialTestResponse(data) {
  console.log('success', data);

  // store ref to current test id
  currentTestId = data.data.testId;
  console.log('currentTestId', currentTestId);

  console.log('resultsUrl', data.data.jsonUrl);

  getResults(data.data.jsonUrl);
}

function onResourceError(err) {
  console.log('error', err);
  cleanup();
}

// do the test
getResource('http://www.webpagetest.org/runtest.php?url=www.andyshora.com&f=json&k=' + config.webPageTestApiKey, 10000)
  .then(initialTestResponse, onResourceError);

function onResultsRetrieved(data) {
  console.log('onResultsRetrieved', data);

  // write the file
  jf.writeFile('public/json/' + currentTestId + '.json', data, function(err) {
    console.log(err)
  })

  cleanup();
}

/**
 * Try to fetch the results json - takes a while in the queue
 * @return {null}
 */
function getResults(resultsUrl) {
  console.log('getResults', resultsUrl);
  if (!resultsUrl) {
    return Q.reject('resultsUrl not set');
  }
  getResource(resultsUrl, 10000)
    .then(onResultsRetrieved, onResourceError)
}

/**
 * Get a resource
 * @param  {string}   url           Target URL
 * @param  {url}      pollInterval  How often to poll
 * @return {Object}   Promise, which is only resolved when statusCode == 200
 */
function getResource(url, pollInterval) {
  var deferred = Q.defer();

  if (typeof pollInterval === 'undefined') {
    pollInterval = 30000;
  }

  var pollingInterval = setInterval(function() {
    restClient.get(url, function(data, response) {
      data = JSON.parse(data);

      if (data.statusCode === 200) {
        clearInterval(pollingInterval);
        deferred.resolve(data);

      } else {
        console.log('Got status. ' + data.statusCode + ', trying again in ', pollInterval);

      }
      
    });
  }, pollInterval);

  return deferred.promise;
}
