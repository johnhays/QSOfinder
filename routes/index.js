
/*
 * GET home page.
 */

jadeoptions = {
	pretty : true,
	self : false,
	debug : false,
	compileDebug : false
};

exports.index = function(req, res){
  res.render('index', { title: 'HF D-STAR QSO Finder' });
};
standardfreq = [ "50.2100", "28.5700", "24.9380", "21.3800", "18.1480", "14.3350", "7.2850", "3.8800" ];

hamqthcall = ''; // Your HAMQTHAPI Callsign
hamqthapipw = ''; // Your HAMQTHAPI Password
hamqthprog = ''; // Your HAMQTHAPI Application Name
tokenURL = 'http://www.hamqth.com/xml.php?u=' + hamqthcall + '&p=' + hamqthapipw; // include your HamQTH 
lookupURL = 'http://www.hamqth.com/xml.php?id=';
userJade = 'views/user.jade';
freqJade = 'views/frequencies.jade';
googleMapURL = 'https://maps.google.com?q=';
