const mysql = require('mysql')

class Wrapsql {

    /**
     * Constructor accepts either pre-built mySql connection or config object. 
     * @param {object} sql Pre-built mySql connection or config object.
     * @param {bool} debug Toggle debug mode which prints all queries to console. 
     */
	constructor(sql,debug=false){

        this.debug = debug

        if ( sql.hasOwnProperty('config') ){
            this.sql = sql
        } else {
            this.sql = mysql.createConnection({
                host: sql.host,
                port: sql.port,
                user: sql.user,
                password: sql.password,
                database: sql.database
            })
        }
    }

    /**
     * Returns details about db connection. Useful for determining if the conneciton was successful before running queries. 
     */
    connect(){
        return new Promise( ( resolve, reject ) => {
            this.sql.connect( ( err, suc ) => {
                if ( err )
                return reject( err )
                resolve( suc )
            } )
        } )
    }
    
    /**
     * Select all results from table. 
     * @param {string} table Name of table 
     */
    async selectAll(table){

        return this.runQuery(`SELECT * FROM ${table}`)

    }

    /**
     * Select data from a table. 
     * @param {string} table Table to select from.
     * @param {array or string(*)} columns Accepts either an array of columns to return or '*' to return all columns. 
     * @param {object} where Object of where conditions.
     * @param {string} orderBy Column you would like to order by. 
     * @param {string} order Order of results ('ASC','DESC'). 
     * @param {int} limit Number of results to return.
     * @param {int} offset Number of rows to offset before return results. 
     */
    async select(table,columns,where,orderBy=false,order='ASC',limit=false,offset=false,groupBy=false){

        let query = `SELECT `

        if ( Array.isArray(columns) ){
            columns.forEach(column => {
                query += `${column},`
            })
            query = query.substring(0, query.length - 1)
        } else {
            query += ` * FROM ${table} `
        }

        query += this.addOptions(where,orderBy,order,limit,offset,groupBy)

        return this.runQuery(query)

    }

    /**
     * Insert data into a table.
     * @param {string} table Table name.
     * @param {object/array} insert Insert values. Insert multiple rows be submitting an array of insert values.
     */
    async insert(table,insert){

        let query = `INSERT INTO ${table} (`
        
        if( Array.isArray(insert) ){

            for (let property in insert[0]) {
                query += `${property}, `
            }
            query = query.substring(0, query.length - 2)
            
            query += `) VALUES `

            insert.forEach(insertValues => {

                query += `(`
                
                for (let property in insertValues) {
                    query += `${this.formatString(insertValues[property])}, `
                }
                query = query.substring(0, query.length - 2)

                query += `),`

            })

            query = query.substring(0, query.length - 1)

        } else {

            for (let property in insert) {
                query += `${property}, `
            }
            query = query.substring(0, query.length - 2)

            query += `) VALUES (`
            for (let property in insert) {
                query += `${this.formatString(insert[property])}, `
            }
            query = query.substring(0, query.length - 2)
            query += `) `
        }

        return this.runQuery(query)

    }
    
    /**
     * Update values in table.
     * @param {string} table Table Name.
     * @param {object} set Update values.  
     * @param {object} where Object of where conditions.
     */
    async update(table,set,where=false){

        let query = `UPDATE ${table} SET `

        for (let property in set) {
            query += `${property} = ${this.formatString(set[property])}, `
        }
        query = query.substring(0, query.length - 2)
        query += this.addOptions(where)

        return this.runQuery(query)

    }

    /**
     * Delete records from table.   
     * @param {string} table Table name.
     * @param {object} where Values conditions to determine which rows to delete.
     */
    async delete(table,where){

        let query = `DELETE FROM ${table} ` + this.addOptions(where)
        return this.runQuery(query)

    }

    /**
     * Count rows in table.
     * @param {string} table Table name.
     * @param {object} where Values conditions to determine which rows to delete.
     * @param {string} as Label for the result
     */
    async count(table,where=false,as='count'){

        let query = `SELECT COUNT(*) AS ${as} FROM ${table} ${this.addOptions(where)}`
        return this.runQuery(query)

    }


    /**
     * Truncate table.
     * @param {string} table Table name.
     * @param {object} where Values conditions to determine which rows to delete.
     * @param {string} as Label for the result
     */
    async truncate(table){

        let query = `TRUNCATE TABLE ${table}`
        return this.runQuery(query)

    }

    /**
     * Run a SQL query.
     * @param {string} query SQL Query
     */
    async query(query){

        return this.runQuery(query)

    }

    /**
     * Pass through to run SQL queries directly. 
     * @param {string} query MySQL query string. 
     */
    async runQuery(query){
        
        if (this.debug) console.log(query)

        return new Promise( ( resolve, reject ) => {
            this.sql.query(query, [], ( err, rows ) => {
                if ( err ) return reject( err )
                resolve( rows )
            } )
        } )
    }

    /**
     * Execute an array of SQL queries where if there is an error or exception all are rolled back. 
     * @param {array} queryArray Array of sql query strings. 
     */
    async transaction(queryArray){

        return new Promise(async (resolve,reject) => {
            
            try {

                let queryResults = []
                this.sql.beginTransaction((transactionError) => {
                    
                    if (transactionError !== null) {
                        reject(transactionError);
                    }

                    for (const query of queryArray) {

                        if (this.debug) console.log(query)

                        this.sql.query(query, [], ( queryErr, rows ) => {
                      
                            if (queryErr !== null) {
 
                                try {
                                    this.sql.rollback((err) => {
                                        reject(err);
                                    });
                                } catch (rollbackError) {
                                    reject(rollbackError);
                                }
                            }
                            queryResults.push(rows)
                        })
                    }
    
                    this.sql.commit((commitError) => {
                        if (commitError !== null) {
                            reject(commitError);
                        }
                        resolve(queryResults);
                    })

                })
            } catch (error) {
                reject(error);
            }

        })

    }


    /**
     * Adds options to end of SQL string.
     * @param {bool,obj,array} where Can either be an object which defaults to "AND" comparison type of an array of formant ["comparisonType",{{row:value},{row:value}}]
     * @param {string} orderBy Column you would like to order by. 
     * @param {string} order Order of results ('ASC','DESC'). 
     * @param {int} limit Number of results to return.
     * @param {int} offset Number of rows to offset before return results. 
     * @param {string} groupBy Value to group results by.  
     */
    addOptions(where=false,orderBy=false,order='DESC',limit=false,offset=false,groupBy=false){

        let query = ""
        let comparisonType = "AND"

        if ( where ) {

            if ( typeof where === "string" ){
                query += ` WHERE ${where}`
            } else {

                query += ` WHERE `

                if ( Array.isArray(where) ){
                    comparisonType = where[0].toUpperCase()
                    where = where[1]
                }

                if ( comparisonType === "AND" || comparisonType === "OR" ) {

                    for (let property in where) {

                        let operator = "="
                        let value = where[property]

                        if ( Array.isArray(value) ){
                            operator = value[0]
                            value = value[1]
                        }

                        query += `${property} ${operator} ${this.formatString(value)} ${comparisonType} `
                    }

                    query = query.substring(0, query.length - (comparisonType.length+1))

                }

                if ( comparisonType === "IN" ) {


                    for (let property in where) {
 
                        let formattedArray = []

                        where[property].forEach(entry => {
                            formattedArray.push(this.formatString(entry))
                        });

                        formattedArray = formattedArray.join(",")

                        query += `${property} IN (${formattedArray}) `
                    }

                }

            }

       }

        query += (groupBy) ? ` GROUP BY ${groupBy}` : ''
        query += (orderBy) ? ` ORDER BY ${orderBy} ${order}` : ''
        query += (limit) ? ` LIMIT ${limit}` : ''
        query += (offset) ? ` OFFSET ${offset}` : ''


        return query

    }

    /**
     * Escapes "'" character form string if value is not an integer.
     * @param {string} value 
     * @returns 
     */
    formatString(value){
        return (Number.isInteger(value))?value:(`'`+value.replace(/'/g,`''`)+`'`)
    }

}

module.exports = Wrapsql