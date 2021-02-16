class Users {
  constructor() {
    this.users = [],
    this.last={}
  }
  addUser(id, name, room,color='#000') {
    const user = { id, name, room,color }
    this.users.push(user)
    return user
  }
  lastUser(id ,room){
    // this.last = [{ id, name, room }]
 this.users.forEach((user,i) => {
      if (user.id === id){
 
        this.users[i]={...user,last:true}
      } else if(user.room===room){
       this.users[i]={...user,last:false}
 
      }
       
     })
   }
   removeLast(room){
    // this.last = [{ id, name, room }]
 this.users.forEach((user,i) => {
    if(user.room===room){
       this.users[i]={...user,last:false}
 
      }
       
     })
   }
  removeUser(id) {
    const user = this.getUser(id)
    if (user) {
      this.users = this.users.filter(user => user.id !== id)
    }
    return user
  }
  getUser(id) {
    const user = this.users.find(user => user.id === id)
    return user
  }
  getUserList(room) {
    const users = this.users.filter(user => user.room === room)
    const namesArray = users.map(user => ({name:user.name,color:user.color,id:user.id}))
    return namesArray
  }
}

module.exports = { Users }
