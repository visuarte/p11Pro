   fun main(args: Array<String> = arrayOf()) {
       // Parse args for --project-base-dir
       for (i in args.indices) {
           if (args[i] == "--project-base-dir" && i + 1 < args.size) {
               System.setProperty("project.base.dir", args[i + 1])
           }
       }
       val port = System.getenv("SERVER_PORT")?.toIntOrNull() ?: 8080
       embeddedServer(Netty, port = port, host = "0.0.0.0", module = Application::module).start(wait = true)
   }