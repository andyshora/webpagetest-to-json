# webpagetest-to-json
Using a simple node app to call the webpagetest.org API and output results to json.



Hit http://www.webpagetest.org/runtest.php?url=www.andyshora.com
Get response > requestID from xml response
Poll for status of test (every 10secs): http://www.webpagetest.org/testStatus.php?f=xml&test=your_test_id
Wait until response > data > statusCode == 200
Get xml URL for results: response > data > xmlUrl