import mongoose from 'mongoose';

const dbConnect = async () => {
    const DB_URI = process.env.DB_URI 

    if (!DB_URI) {
        console.error('Error: DB_URI no está definida en .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(DB_URI) 
        console.log('Conectado a la base de datos (MongoDB)');
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        process.exit(1);
    }
};

mongoose.connection.on('disconnected', () => {
    console.log('Desconectado de la base de datos');
});


process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Conexión a la base de datos cerrada');
    process.exit(0);
});
//Cierra la conecion al pulsar Crtl + C para parar el servidor. 

export default dbConnect;