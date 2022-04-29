import * as React from 'react'
import {useState, useEffect, useCallback} from 'react'
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native'
import WebSQLite, {
  WebsqlDatabase,
  SQLTransaction,
  SQLResultSet,
  SQLError,
} from 'react-native-quick-websql'

function databaseName(baseName: string) {
  return baseName + '.' + Math.floor(Math.random() * 100000)
}

interface LogEntry {
  msg: string
  key: string
}

export default function App() {
  const [progress, setProgress] = useState<LogEntry[]>([])

  const addLog = useCallback((msg: string) => {
    console.log(msg)
    setProgress((prev) => [
      ...prev,
      {msg, key: Math.floor(Math.random() * 100000).toString()},
    ])
  }, [])

  useEffect(() => {
    addLog(
      typeof sqlite === 'object'
        ? 'quick-sqlite module loaded successfully'
        : 'Error: quick-sqlite module is not loaded'
    )
  }, [])

  const errorCB = useCallback((err: SQLError): void => {
    console.error('error:', err)
    addLog('Error: ' + (err.message || err))
  }, [])

  const errorStatementCB = useCallback(
    (_tx: SQLTransaction, err: SQLError): boolean => {
      errorCB(err)
      return false
    },
    []
  )

  const successCB = useCallback(() => {
    console.log('SQL executed ...')
  }, [])

  const openCB = useCallback(() => {
    addLog('Database OPEN')
  }, [])

  const populateDatabase = useCallback((db: WebsqlDatabase) => {
    return new Promise<void>((resolve) => {
      addLog('Database integrity check')
      const prepareDB = () => {
        db.transaction(populateDB, errorCB, () => {
          addLog('Database populated ... executing query ...')
          db.transaction(queryEmployees, errorCB, () => {
            console.log('Transaction is now finished')
            addLog('Processing completed.')
            db.transaction(cleanupTables, errorCB, () => {
              // closeDatabase(db)
              resolve()
            })
          })
        })
      }

      db.transaction((txn) => {
        txn.executeSql(
          'SELECT 1 FROM Version LIMIT 1',
          [],
          prepareDB,
          (_, error) => {
            console.log('received version error:', error)
            addLog('Database not yet ready ... populating data')
            prepareDB()
            return false
          }
        )
      })
    })
  }, [])

  const populateDB = (tx: SQLTransaction) => {
    addLog('Executing DROP stmts')

    tx.executeSql('DROP TABLE IF EXISTS Employees;')
    tx.executeSql('DROP TABLE IF EXISTS Offices;')
    tx.executeSql('DROP TABLE IF EXISTS Departments;')

    addLog('Executing CREATE stmts')

    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS Version( ' +
        'version_id INTEGER PRIMARY KEY NOT NULL); ',
      [],
      successCB,
      errorStatementCB
    )

    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS Departments( ' +
        'department_id INTEGER PRIMARY KEY NOT NULL, ' +
        'name VARCHAR(30) ); ',
      [],
      successCB,
      errorStatementCB
    )

    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS Offices( ' +
        'office_id INTEGER PRIMARY KEY NOT NULL, ' +
        'name VARCHAR(20), ' +
        'longtitude FLOAT, ' +
        'latitude FLOAT ) ; ',
      [],
      successCB,
      errorStatementCB
    )

    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS Employees( ' +
        'employe_id INTEGER PRIMARY KEY NOT NULL, ' +
        'name VARCHAR(55), ' +
        'office INTEGER, ' +
        'department INTEGER, ' +
        'FOREIGN KEY ( office ) REFERENCES Offices ( office_id ) ' +
        'FOREIGN KEY ( department ) REFERENCES Departments ( department_id ));',
      []
    )

    addLog('Executing INSERT stmts')

    tx.executeSql(
      'INSERT INTO Departments (name) VALUES ("Client Services");',
      []
    )
    tx.executeSql(
      'INSERT INTO Departments (name) VALUES ("Investor Services");',
      []
    )
    tx.executeSql('INSERT INTO Departments (name) VALUES ("Shipping");', [])
    tx.executeSql('INSERT INTO Departments (name) VALUES ("Direct Sales");', [])

    tx.executeSql(
      'INSERT INTO Offices (name, longtitude, latitude) VALUES ("Denver", 59.8,  34.);',
      []
    )
    tx.executeSql(
      'INSERT INTO Offices (name, longtitude, latitude) VALUES ("Warsaw", 15.7, 54.);',
      []
    )
    tx.executeSql(
      'INSERT INTO Offices (name, longtitude, latitude) VALUES ("Berlin", 35.3, 12.);',
      []
    )
    tx.executeSql(
      'INSERT INTO Offices (name, longtitude, latitude) VALUES ("Paris", 10.7, 14.);',
      []
    )

    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Sylvester Stallone", 2,  4);',
      []
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Elvis Presley", 2, 4);',
      []
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Leslie Nelson", 3,  4);',
      []
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Fidel Castro", 3, 3);',
      []
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Bill Clinton", 1, 3);',
      []
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Margaret Thatcher", 1, 3);',
      []
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Donald Trump", 1, 3);',
      []
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES (?, 1, 3);',
      ['Zero\0Null']
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Dr DRE", 2, 2);',
      []
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Samantha Fox", 2, 1);',
      []
    )
    console.log('all config SQL done')
  }

  const queryEmployees = (tx: SQLTransaction) => {
    console.log('Executing sql...')
    tx.executeSql(
      'SELECT a.name, b.name as deptName FROM Employees a, Departments b WHERE a.department = b.department_id and a.department=?',
      [3],
      queryEmployeesSuccess,
      errorStatementCB
    )
  }

  const queryEmployeesSuccess = (
    _tx: SQLTransaction,
    results: SQLResultSet
  ) => {
    console.log('results:', JSON.stringify(results, null, 4))
    addLog('Query completed')
    var len = results.rows?.length || 0
    for (let i = 0; i < len; i++) {
      let row = results.rows?.item(i)
      addLog(
        `Empl Name: ${JSON.stringify(row.name)}, Dept Name: ${JSON.stringify(
          row.deptName
        )}`
      )
    }
  }

  const cleanupTables = (tx: SQLTransaction) => {
    addLog('Executing DROP stmts')

    tx.executeSql('DROP TABLE IF EXISTS Employees;')
    tx.executeSql('DROP TABLE IF EXISTS Offices;')
    tx.executeSql('DROP TABLE IF EXISTS Departments;')
  }

  const loadAndQueryDB = useCallback(async () => {
    addLog('Opening database ...')
    const db = WebSQLite.openDatabase(
      databaseName('mydb'),
      undefined,
      undefined,
      undefined,
      openCB
    )
    await populateDatabase(db)
  }, [])

  /*
   * PRAGMA
   */

  const pragmaTests = async () => {
    addLog('Open separate DB and run PRAGMA tests')
    const db = WebSQLite.openDatabase(
      databaseName('pragra-test'),
      undefined,
      undefined,
      undefined,
      openCB
    )
    await queryingPragma(db, false)
    await assigningPragma(db)
    await queryingPragma(db, true)
    await buildPragmaSchema(db)
    await assigningParenthesisPragma(db)
  }

  const assigningPragma = (db: WebsqlDatabase) => {
    return new Promise<void>((resolve) => {
      let sql = 'PRAGMA journal_mode = WAL'
      db._db.exec([{sql: sql, args: []}], false, (_, result) => {
        const row = result?.[0]?.rows?.[0]
        let journal_mode = row?.journal_mode
        if (journal_mode == 'wal') {
          addLog('✅ ' + sql)
        } else {
          addLog('❌ ' + sql)
          console.log(result, journal_mode)
        }
        resolve()
      })
    })
  }

  const queryingPragma = (db: WebsqlDatabase, isWal: boolean) => {
    return new Promise<void>((resolve) => {
      let sql = 'PRAGMA journal_mode'
      db._db.exec([{sql: sql, args: []}], false, (_, result) => {
        const row = result?.[0]?.rows?.[0]
        const journal_mode = row?.journal_mode
        // Default journal_modes differ on Android & iOS
        if (
          (!isWal && journal_mode != 'wal') ||
          (isWal && journal_mode == 'wal')
        ) {
          addLog('✅ ' + sql)
        } else {
          addLog('❌ ' + sql)
          console.log(result, journal_mode)
        }
        resolve()
      })
    })
  }

  const buildPragmaSchema = (db: WebsqlDatabase) => {
    return new Promise<void>((resolve) => {
      db._db.exec(
        [
          {
            sql: 'CREATE TABLE Version(version_id INTEGER PRIMARY KEY NOT NULL);',
            args: [],
          },
        ],
        false,
        (_, _result) => {
          resolve()
        }
      )
    })
  }

  const assigningParenthesisPragma = (db: WebsqlDatabase) => {
    return new Promise<void>((resolve) => {
      let sql = 'PRAGMA main.wal_checkpoint(FULL)'
      db._db.exec([{sql: sql, args: []}], false, (_, result) => {
        const row = result?.[0]?.rows?.[0]
        if (row.busy == 0 && row.checkpointed != -1 && row.log != -1) {
          addLog('✅ ' + sql)
        } else {
          addLog('❌ ' + sql)
          console.log(result, row)
        }
        resolve()
      })
    })
  }

  const runDemo = useCallback(async () => {
    addLog('Starting SQLite Callback Demo')
    await loadAndQueryDB()
    await pragmaTests()
  }, [])

  const renderProgressEntry = useCallback((entry: {item: LogEntry}) => {
    const {item} = entry
    return (
      <View style={listStyles.li}>
        <View>
          <Text style={listStyles.liText}>{item.msg}</Text>
        </View>
      </View>
    )
  }, [])

  return (
    <SafeAreaView style={styles.mainContainer}>
      <TouchableOpacity style={styles.toolbar} onPress={() => runDemo()}>
        <Text style={styles.toolbarButton}>Run Demo</Text>
      </TouchableOpacity>
      <FlatList
        data={progress}
        renderItem={renderProgressEntry}
        style={listStyles.liContainer}
      />
    </SafeAreaView>
  )
}

var listStyles = StyleSheet.create({
  li: {
    borderBottomColor: '#c8c7cc',
    borderBottomWidth: 0.5,
    paddingTop: 15,
    paddingRight: 15,
    paddingBottom: 15,
  },
  liContainer: {
    backgroundColor: '#fff',
    flex: 1,
    paddingLeft: 15,
  },
  liIndent: {
    flex: 1,
  },
  liText: {
    color: '#333',
    fontSize: 17,
    fontWeight: '400',
    marginBottom: -3.5,
    marginTop: -3.5,
  },
})

var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  toolbar: {
    backgroundColor: '#51c04d',
    flexDirection: 'row',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarButton: {
    color: 'white',
    textAlign: 'center',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    flex: 1,
  },
})
