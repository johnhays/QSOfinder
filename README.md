# QSOfinder
A node.js realtime QSO finder application.

Under Development -- No warranty, no support, use at your own risk.  Security is your responsibility. If you want to run a https version, see Node Express and get free certificates from LetEncrypt.org

See: https://itnext.io/node-express-letsencrypt-generate-a-free-ssl-certificate-and-run-an-https-server-in-5-minutes-a730fbe528ca

Prerequisites:

couchdb (Apache) -- more info:
http://docs.couchdb.org/en/latest/install/unix.html#installation-using-the-apache-couchdb-convenience-binary-packages

node.js

npm

Once you have couchdb installed and running, create a database called 'dash'. This is accomplished with the following command line call *Unix or Linux). 

curl -X PUT http://127.0.0.1:5984/dash

Clone the software:

git clone https://github.com/johnhays/QSOfinder.git

cd QSOfinder

npm install

edit routes/index.js with your HamQTH credentials -- https://www.hamqth.com/developers.php and various titles, logo, etc.

edit qsofinder.js to change port or IP address.  By default it listens on all interfaces for both IPv4 and IPv6 and port 8008.

Run with node.js

e.g. node qsofinder.js

Create a script to run it as a daemon/service on startup and to restart on failure -- this is OS specific.

