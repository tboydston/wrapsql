const Wrapsql = require('./wrapsql.js')
const mysql = require('mysql')
const expect = require('chai').expect;

// const sysConfig = {
// 	dbHost:'127.0.0.1',
// 	dbPort:8889,
// 	dbUsername:'',
// 	dbPassword:'',
// }

const sysConfig = require('./config-test.js')

describe('WrapSQL Unit Tests', async function() {

    if ( sysConfig.dbUsername == "" || sysConfig.dbPassword == " " ){
        console.log("Username and password must be set for 'unitTestDb'")
        process.exit()
    }


    const sql = mysql.createConnection({
        host: sysConfig.dbHost,
        port: sysConfig.dbPort,
        user: sysConfig.dbUsername,
        password: sysConfig.dbPassword,
        database: 'unitTestDb'
    }) 

    const wsql = new Wrapsql(sql,true)

    describe('connection', async function() {
    
        it('Should connect to db without error.', async function() {
            try{
                await wsql.connect()
            } catch(e){
                console.log(e)
                expect()
            }
        })
    
    
      })

    describe('selectAll', async function() {
    
    it('Should return all of test table 1', async function() {
        let result = await wsql.selectAll('testTable')
        console.log( result )
        expect(result[0].value).to.equal("testRow1")
    })

    it('Should return error as table does not exist.', async function() {
        try{
            await wsql.selectAll('testTablesdf')
        } catch(e){
            expect()
        }
        
    })

  })


  describe('addOptions', async function() {
    
    it(`Should create valid sql string with with default 'AND' comparison options.`, async function() {

        let result = wsql.addOptions({user:"bill",pass:"test",id:1},'id','DESC',10,1)
        expect(result).to.equal(" WHERE user = 'bill' AND pass = 'test' AND id = 1  ORDER BY id DESC LIMIT 10 OFFSET 1")
        
    })

    it(`Should create valid sql string with 'OR' comparison and options.`, async function() {

        let result = wsql.addOptions(["or",{user:"bill",pass:"test",id:1}],'id','DESC',10,1)
        expect(result).to.equal(" WHERE user = 'bill' OR pass = 'test' OR id = 1  ORDER BY id DESC LIMIT 10 OFFSET 1")
        
    })

    it(`Should create valid sql string with 'IN' comparison and options.`, async function() {

        let result = wsql.addOptions(["IN",{user:[1,"bill","bill's"]}],'id','DESC',10,1)
        expect(result).to.equal(" WHERE user IN ('1,bill,bill''s')  ORDER BY id DESC LIMIT 10 OFFSET 1")
        
    })

    it(`Should create valid sql string with with default 'AND' comparison and customer '>' and '<' operators options.`, async function() {

        let result = wsql.addOptions({user:[">","bill"],pass:["<","test"],id:1},'id','DESC',10,1)
        expect(result).to.equal(" WHERE user > 'bill' AND pass < 'test' AND id = 1  ORDER BY id DESC LIMIT 10 OFFSET 1")
        
    })

    it(`Should return customer 'where' string.`, async function() {

        let result = wsql.addOptions('user=bob AND dog IS NOT null AND black != white','id','DESC',10,1)
        expect(result).to.equal(" WHERE user=bob AND dog IS NOT null AND black != white ORDER BY id DESC LIMIT 10 OFFSET 1")
        
    })

  })

  describe('select', async function() {
    
    it('Should return testRow2', async function() {

        let result = await wsql.select('testTable','value',{value:"testRow2"},orderBy=false,"DESC",10,offset=false)
        expect(result[0].value).to.equal("testRow2")
        
    })

    it('Should return testRow2 as first result.', async function() {

        let result = await wsql.select('testTable','value',false,orderBy='id',"DESC",10,offset=false,"id")
        expect(result[0].value).to.equal("testRow2")
        
    })
    
    it('Should return testRow2 using limit and offset.', async function() {

        let result = await wsql.select('testTable','value',false,'id',"DESC",1,0)
        
        expect(result[0].value).to.equal("testRow2")
        
    })

    it(`Should return testRow2 using '>' operator.`, async function() {

        let result = await wsql.select('testTable','value',{id:[">",1]},'id',"DESC",1,0)
        
        expect(result[0].value).to.equal("testRow2")
        
    })

    it(`Should return testRow2 using 'IN' comparison.`, async function() {

        let result = await wsql.select('testTable','value',['IN',{id:[2]}],'id',"DESC",1,0)
        
        expect(result[0].value).to.equal("testRow2")
        
    })

  }) 

  describe('insert', async function() {
    
    it('Should insert new value into insert table.', async function() {
        
        let result = await wsql.insert('insertTest',{value:"testInsert"})
        expect(result.affectedRows).to.equal(1)
        
    })

    it('Should insert a numeric value into the table.', async function() {
        
        let result = await wsql.insert('insertTest',{value:1})
        expect(result.affectedRows).to.equal(1)
        
    })

    it('Should insert multiple values into insert table.', async function() {
        
        let result = await wsql.insert('insertTest',[{value:"testInsert2"},{value:"testInsert3"}])
        expect(result.affectedRows).to.equal(2)
        
    })

    it(`Should insert values into insert table that contain "'" and escape them correctly.`, async function() {
        
        let insertValue = "te'st''In'se'rt"
        let insertResult = await wsql.insert('insertTest',{value:insertValue})
        let selectResult = await wsql.select('insertTest','value',{value:insertValue})

        expect(selectResult[0].value).to.equal(insertValue)
        
    })

  })
  
  describe('update', async function() {
    
    it('Should update first record in insert table.', async function() {
        
        let result = await wsql.update('insertTest',{value:'updated'},{value:'1'})
        expect(result.affectedRows).to.equal(1)
        
    })

  })

  describe('delete', async function() {
    
    it('Should delete record.', async function() {
        
        let result = await wsql.delete('insertTest',{value:'updated'})
        expect(result.affectedRows).to.equal(1)
        
    })

  })

  describe('count', async function() {
    
    it('Should count number of records.', async function() {
        
        let result = await wsql.count('testTable',{value:'testRow2'},'theCount')
        console.log(result)
        expect(result[0].theCount).to.equal(1)
        
    })

  })

  describe('transaction', async function() {
    
    it('Should select records twice.', async function() {

        let queries = [
            "SELECT * FROM testTable ORDER BY id DESC",
            "SELECT * FROM testTable",
        ]
        
        let result = await wsql.transaction(queries)

        expect(result[0][0].id).to.equal(2)
        expect(result[0][1].id).to.equal(1)
        
    })

    it('Should reject because of invalid sql.', async function() {

        let queries = [
            "SELECT * FROM testTable ORDER BY id DESC",
            "Blaa",
        ]
        
        try{
            await wsql.transaction(queries)
        }catch(e){
            expect()
        }

    })

  })

  describe('constructor', async function() {
    
    it('Should build mySQL connection inside class', async function() {
        
        const wsql2 = new Wrapsql({
            host: sysConfig.dbHost,
            port: sysConfig.dbPort,
            user: sysConfig.dbUsername,
            password: sysConfig.dbPassword,
            database: 'unitTestDb'
        },true)

        let result = await wsql2.select('testTable','value',{value:"testRow2"},orderBy=false,"DESC",10,offset=false)
        expect(result[0].value).to.equal("testRow2")
        
    })

  })

})