import { Socket } from '@supabase/realtime-js'
import axios from 'axios'
const REALTIME_URL = process.env.REALTIME_URL || 'ws://localhost:4000/socket'

export default class Index extends React.Component {
  constructor() {
    super()
    this.state = {
      received: [],
      socketState: 'CONNECTING',
      users: [],
      todos: [],
    }
    this.messageReceived = this.messageReceived.bind(this)

    this.socket = new Socket(REALTIME_URL)
    this.channelList = []
  }
  componentDidMount() {
    this.socket.connect()
    this.addChannel('realtime:*')
    this.addChannel('realtime:public:users')
    this.addChannel('realtime:public:todos')
    this.fetchData()
  }
  addChannel(topic) {
    let channel = this.socket.channel(topic)
    channel.on('*', msg => this.messageReceived(topic, msg))
    channel
      .join()
      .receive('ok', () => console.log('Connecting'))
      .receive('error', () => console.log('Failed'))
      .receive('timeout', () => console.log('Waiting...'))
    this.channelList.push(channel)
  }
  messageReceived(channel, msg) {
    console.log('channel', channel)
    console.log('msg', msg)
    let received = [...this.state.received, { channel, msg }]
    this.setState({ received })
  }
  async fetchData() {
    try {
      let { data: users } = await axios.get('/api/fetch/users')
      let { data: todos } = await axios.get('/api/fetch/todos')
      this.setState({ users, todos })
    } catch (error) {
      console.log('error', error)
    }
  }
  async insertUser() {
    let { data: user } = await axios.post('/api/new-user', {})
    this.setState({ users: [...this.state.users, user]})
  }
  async insertTodo() {
    let { data: todo } = await axios.post('/api/new-todo', {})
    console.log('todo', todo)
    this.setState({ todos: [...this.state.todos, todo]})
  }
  render() {
    return (
      <div style={styles.main}>
        <div style={styles.row}>
          <div style={styles.col}>
            <h3>Changes</h3>
            <p>Listening on {REALTIME_URL}</p>
            <p>Try opening two tabs and clicking the buttons!</p>
          </div>
          <div style={styles.col}>
            <h3>Users</h3>
            <button onClick={() => this.insertUser()}>Add random user</button>
          </div>
          <div style={styles.col}>
            <h3>Todos</h3>
            <button onClick={() => this.insertTodo()}>Add random todo</button>
          </div>
        </div>
        <div style={styles.row}>
          <div style={styles.col}>
            {this.state.received.map(x => (
              <div key={Math.random()}>
                <p>Received on {x.channel}</p>
                <pre style={styles.pre}>
                  <code style={styles.code}>{JSON.stringify(x.msg, null, 2)}</code>
                </pre>
              </div>
            ))}
          </div>
          <div style={styles.col}>
            {this.state.users.map(user => (
              <pre style={styles.pre} key={user.id}>
                <code style={styles.code}>{JSON.stringify(user, null, 2)}</code>
              </pre>
            ))}
          </div>
          <div style={styles.col}>
            {this.state.todos.map(todo => (
              <pre style={styles.pre} key={todo.id}>
                <code style={styles.code}>{JSON.stringify(todo, null, 2)}</code>
              </pre>
            ))}
          </div>
        </div>
      </div>
    )
  }
}

const styles = {
  main: { fontFamily: 'monospace', height: '100%', margin: 0, padding: 0 },
  pre: {
    whiteSpace: 'pre',
    overflow: 'auto',
    background: '#333',
    maxHeight: 200,
    borderRadius: 6,
    padding: 5,
  },
  code: { display: 'block', wordWrap: 'normal', color: '#fff' },
  row: { display: 'flex', flexDirection: 'row', height: '100%' },
  col: { width: '33%', maxWidth: '33%', padding: 10, height: '100%', overflow: 'auto' },
}
