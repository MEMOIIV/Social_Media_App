import { ISayHiDTO } from "./chat.dto";

class ChatService {
  constructor() {}

  // REST API




  // SOCKET IO
  sayHi = ({socket , message , callback} : ISayHiDTO) => {
    try {
        console.log(message);
        callback ? callback("I received your message") : undefined
        
    } catch (error) {
        socket.emit("custom_error" , error)
    }
  }
}

export default new ChatService()