const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../shared-db/database.sqlite');

function getDbConnection() {
    return new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Could not connect to database', err);
        } else {
            console.log('Connected to SQLite database');
        }
    });
}


const clientModel = {
  
  getAllEvents: () => {
    return new Promise((resolve, reject) => {
      const db = getDbConnection();
      db.all('SELECT * FROM events WHERE available_tickets > 0 ORDER BY date', [], (err, rows) => {
        db.close();
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },


  getEventById: (id) => {
    return new Promise((resolve, reject) => {
      const db = getDbConnection();
      db.get('SELECT * FROM events WHERE id = ?', [id], (err, row) => {
        db.close();
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

   //Purchasing the ticket
  purchaseTicket: (purchaseData) => {
    return new Promise((resolve, reject) => {
      const { event_id, customer_name, quantity } = purchaseData;
      const db = getDbConnection();

      //Start transaction
      db.serialize(() => {
        //Check if tickets available
        db.get('SELECT available_tickets FROM events WHERE id = ?', [event_id], (err, event) => {
          if (err) {
            db.close();
            reject(err);
            return;
          }

          if (!event) {
            db.close();
            reject(new Error('Event not found'));
            return;
          }

          if (event.available_tickets < quantity) {
            db.close();
            reject(new Error('Not enough tickets available'));
            return;
          }

          //Insert purchase
          db.run(
            'INSERT INTO purchases (event_id, customer_name, customer_email, quantity) VALUES (?, ?, ?, ?)',
            [event_id, customer_name, quantity],
            function(err) {
              if (err) {
                db.close();
                reject(err);
                return;
              }

              const purchaseId = this.lastID;

              //Update available tickets
              db.run(
                'UPDATE events SET available_tickets = available_tickets - ? WHERE id = ?',
                [quantity, event_id],
                (err) => {
                  db.close();
                  if (err) reject(err);
                  else resolve({ 
                    id: purchaseId, 
                    event_id, 
                    customer_name, 
                    quantity,
                    message: 'Ticket purchased successfully!' 
                  });
                }
              );
            }
          );
        });
      });
    });
  }
};

module.exports = clientModel;