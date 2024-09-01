import axios from "axios";

const server = "https://ice-server-socket.onrender.com/api/v1"
// const server = "http://10.0.2.2:8000/api/v1"
export const loadUser = async () => {
    try {

        console.log("darshan");


        // Axios
        const res = await axios.get(`${server}/me`, {
            "withCredentials": true
        })



        return res.data
    } catch (error) {
        console.log("error load user", error);
        return error.response
    }

}

export const login = async (phone, password) => {
    try {

        // Axios
        const res = await axios.post(`${server}/login`, {
            phone, password
        }, {
            headers: {
                "Content-Type": "application/json"
            },
            "withCredentials": true
        })



        return res.data

    } catch (error) {
        console.log(error.response.data);

        return error.response.data.message

    }
}

export const loadUserList = async () => {
    try {


        // Axios
        const res = await axios.get(`${server}/user-list`, {
            "withCredentials": true
        })


        return res.data
    } catch (error) {
        console.log("error load user list", error.response.data);
        return error.response.data
    }

}

export const sendTokenToServer = async (token) => {
    try {

        console.log("sending token");
        const res = await axios.post(`${server}/save-token`,
            { token }, {
            headers: {
                "Content-Type": "application/json"
            },
            "withCredentials": true
        }
        );
        console.log('Device token sent to server successfully!', res.data);
    } catch (error) {
        console.error('Failed to send device token to server:', error);
    }
};
