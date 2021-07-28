# WrapSQL ( wrapsequel )

A MySQL wrapper that allows you to perform basic CRUD updates on a DB without writing any SQL. Results are returned as promises allowing the uses of 'await' when synchronous request are required. 
<br><br>

## Getting Started
<br>

```
npm install wrapsequel 
```

You can either pass Wrapsql an active MySQL connection or just the connection settings and Wrapsql will create it's own.
<br>
<br>
### Wrapsql builds MySQL connection
<br>

```
    const Wrapsql = require('wrapsequel')

    const config = {
        host: '127.0.0.1',
        port: '8889',
        user: 'user',
        password: 'password',
        database: 'database'
    }

    const wsql = new Wrapsql(config,true)
    
    let result = await wsql.selectAll('testTable')
    console.log( result )

```

### MySQL connection is built and passed to Wrapsql
<br>

```
    const mysql = require('mysql')
    const Wrapsql = require('wrapsequel')

    const sql = mysql.createConnection({
        host: '127.0.0.1',
        port: '8889',
        user: 'user',
        password: 'password',
        database: 'database'
    }) 

    const wsql = new Wrapsql(sql,true)

    let result = await wsql.selectAll('testTable')
    console.log( result )

```
<br><br>

## Functions

<br>

### **selectAll(tableName)**

<br>

Select all results from a table.

**tableName:** Name of table 

### Example

```

    let result = await wsql.selectAll('testTable')

```


<br>

### **select( table, columns, where, orderBy=false, order='ASC', limit=false, offset=false )**

<br>

Select data from a table. <br><br>
**table:** Table to select from.<br>
**columns:** Accepts either an array of columns to return or '*' to return all columns. <br>
**where:** Object of where conditions, Array defining custom comparison, or string of customer where conditions. Default comparison is 'AND' default operator '='. See  examples below for details.). May Be False to exclude.<br>
**orderBy:** Column you would like to order by.  May Be False to exclude.<br>
**order:** Order of results ('ASC','DESC').  May Be False to exclude.<br>
**limit:** Number of results to return.  May Be False to exclude.<br>
**offset:** Number of rows to offset before return results.  May Be False to exclude.<br>
**groupBy:** Column to group results by.  May Be False to exclude.<br>

###**where:** comparisons can be represented the following ways. 

```

// Default 'AND' comparison
{column1:value,colum2:value}
// SQL Result: WHERE column1=value AND column2:value

// Defined 'AND' comparison 
["AND",{column1:value,colum2:value}]
// SQL Result: WHERE column1=value AND column2:value

// Defined 'OR' comparison 
["OR",{column1:value,colum2:value}]
// SQL Result: WHERE column1=value OR column2:value

// Defined 'IN' comparison 
["IN",{column1:[value1,value2]}]
// SQL Result: WHERE column1 IN ('value1','value2')

// Defined operator 
{column1:[">",value],colum2:["<",value]}
// SQL Result: WHERE column1>value AND column2<value

// Customer WHERE string 
`column1>value AND column2 IS NOT null OR column2 = 'test'`
// SQL Result: WHERE column1>value AND column2 IS NOT null OR column2 = 'test'

```

### Example

```
    // Equivalent SQL: SELECT 'value' FROM 'testTable' WHERE value='testValue' GROUP BY 'value' ORDER BY 'id' DESC LIMIT 10
    let result = await wsql.select('testTable','value',{value:"testValue"},"id","DESC",10,offset=false,value)
```

<br>

### **insert(table,insert)**

<br>

Insert data into a table. <br><br>
**table:** Table to select from.<br>
**insert:** Object of values to insert {column:"value"} or array of Objects to insert multiple rows.<br>

### Example

```
    // Single row insert.
    let result = await wsql.insert('insertTest',{testData:"testInsert"})
    // Multiple row insert.
    let result2 = await wsql.insert('insertTest',[{testData:"testInsert1"},{testData:"testInsert2"}])

```



<br>

### **update(table,update,where=false)**

<br>

Update records <br><br>
**table:** Table to update.<br>
**update:** Object of values to update {column:"value"} <br>
**where:** Object of where conditions. May Be False<br>

### Example

```

    let result = await wsql.update('insertTest',{value:'updated'},{value:'1'})

```


<br>

### **delete(table,where=false)**

<br>

Delete records. <br><br>
**table:** Table to delete records from.<br>
**where:** Object of where conditions. May Be False<br>

### Example

```

    let result = await wsql.delete('insertTest',{value:'1'})

```


<br>

### **count(table,where=false,label)**

<br>

Count rows in result.<br><br>
**table:** Table to delete records from.<br>
**where:** Object of where conditions. May Be False<br>
**label:** Label for count results.<br>


### Example

```

    let result = await wsql.delete('testTable',{value:'testRow2'},'theCount')

```


<br>

### **transaction(queries)**

<br>

Submit an array of dependant SQL queries to be executed in one request. If one fails they are all rolled back. Results is returned as array of arrays.<br><br>
**queries:** Array of SQL queries.<br>

### Example

```

        let queries = [
            "SELECT * FROM testTable ORDER BY id DESC",
            "SELECT * FROM testTable",
        ]
        
        let result = await wsql.transaction(queries)

        // result[0] first queries results. 
        // result[1] second queries results.   

```


<br>

### **query(query)**

<br>

Pass through a raw SQL query.<br><br>
**query:** SQL query<br>

### Example

```

        let query = "SELECT * FROM testTable ORDER BY id DESC"
        
        let result = await wsql.transaction(query)


```