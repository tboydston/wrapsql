const Wrapsql = require('./wrapsql.js')

const sysConfig = require('./config-test.js')


/* Customer Table

CREATE TABLE `customers` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `firstName` varchar(64) DEFAULT NULL,
  `lastName` varchar(64) DEFAULT NULL,
  `favoriteAnimal` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

*/

;(async()=>{

    const wsql = new Wrapsql({
        host: sysConfig.dbHost,
        port: sysConfig.dbPort,
        user: sysConfig.dbUsername,
        password: sysConfig.dbPassword,
        database: 'unitTestDb'
    },true)

    wsql.truncate("customers")

    // Equivalent SQL: INSERT INTO customers (firstName, lastName, favoriteAnimal) VALUES ('Bob', 'Smith', 'dog') 
    let insertResult = await wsql.insert("customers",{firstName:"Bob",lastName:"Smith",favoriteAnimal:"dog"})

    // Insert Result:  {
    //   fieldCount: 0,
    //   affectedRows: 1,
    //   insertId: 1,
    //   serverStatus: 2,
    //   warningCount: 0,
    //   message: '',
    //   protocol41: true,
    //   changedRows: 0
    // }

    
    // Results can be returned either using async/await or then/catch promise syntax 

    let selectResult = {}
    // Equivalent SQL: SELECT  * FROM customers WHERE firstName = 'Bob' AND lastName = 'Smith' 
    try {
        selectResult = await wsql.select("customers","*",{firstName:"Bob",lastName:"Smith"})
    } catch(error) {
        console.log(error)
    }

    console.log(selectResult)

    // OR 

    wsql.select("customers","*",{firstName:"Bob",lastName:"Smith"}).then(
            result=>{selectResult=result}
        ).catch(error=>{
            console.log(error)
        })

    // Select Result: [
    //   {
    //     id: 1,
    //     firstName: 'Bob',
    //     lastName: 'Smith',
    //     favoriteAnimal: 'dog'
    //   }
    // ]

    // Equivalent SQL: UPDATE customers SET favoriteAnimal = 'cat' WHERE id = 1 
    let updateResult = await wsql.update("customers",{favoriteAnimal:"cat"},{id:1})

    // Update Result: {
    //   fieldCount: 0,
    //   affectedRows: 1,
    //   insertId: 0,
    //   serverStatus: 2,
    //   warningCount: 0,
    //   message: '(Rows matched: 1  Changed: 1  Warnings: 0',
    //   protocol41: true,
    //   changedRows: 1
    // }

    // Equivalent SQL: DELETE FROM customers WHERE id = 1 
    let deleteResult = await wsql.delete("customers",{id:1})

    // Delete Result: {
    //   fieldCount: 0,
    //   affectedRows: 1,
    //   insertId: 0,
    //   serverStatus: 2,
    //   warningCount: 0,
    //   message: '',
    //   protocol41: true,
    //   changedRows: 0
    // }


})()