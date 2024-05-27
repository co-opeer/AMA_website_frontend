const CLIENT_ID = '858949201125-hhv5q0287sn0tr84su545al0sb04auno.apps.googleusercontent.com'; // Replace with your CLIENT_ID
const API_KEY = 'AIzaSyAPNEcOrV4KkdLOfobxUNfunfcp29ql8Q0'; // Replace with your API_KEY
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

let tokenClient;
let gapiInited = false;
let gisInited = false;

function initializeGapiClient() {
    gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
    }).then(() => {
        gapiInited = true;
        maybeEnableButtons();
    }).catch(error => {
        console.error('GAPI init error:', error);
    });
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('uploadButton').disabled = false;
    }
}

function handleAuthClick() {
    tokenClient.requestAccessToken();
}

function handleAuthResult(response) {
    if (response.error) {
        console.error('Auth error:', response.error);
        return;
    }
    getUserEmail(response.access_token);
}

async function getUserEmail(accessToken) {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const userInfo = await response.json();
        console.log('User email:', userInfo.email);

        const fileId = await uploadFile(accessToken);
        await addRecordToDatabase(userInfo.email, fileId);
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

async function uploadFile(accessToken) {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.readAsArrayBuffer(file);
    return new Promise((resolve, reject) => {
        reader.onload = async function(e) {
            const content = e.target.result;
            const metadata = {
                name: file.name,
                mimeType: file.type,
                parents: ['1nqwVb10YD_q21gzqc6fiKpXcZH0KCQ2q'] // Replace with your folder ID
            };
            const boundary = '-------314159265358979323846';
            const delimiter = `\r\n--${boundary}\r\n`;
            const close_delim = `\r\n--${boundary}--`;

            const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
            const filePart = `${delimiter}Content-Type: ${file.type}\r\nContent-Transfer-Encoding: binary\r\n\r\n`;

            const multipartRequestBody = new Blob([
                metadataPart,
                filePart,
                new Uint8Array(content),
                close_delim
            ]);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
            xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
            xhr.setRequestHeader('Content-Type', `multipart/related; boundary="${boundary}"`);
            xhr.onload = function() {
                if (xhr.status === 200) {
                    const file = JSON.parse(xhr.responseText);
                    console.log('File Id:', file.id);

                    resolve(file.id);
                } else {
                    console.error('Upload error:', xhr.responseText);

                    reject(xhr.responseText);
                }
            };
            xhr.send(multipartRequestBody);
        };
    });
}

async function addRecordToDatabase(email, fileId) {
    try {
        const response = await fetch('http://localhost:5000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, url: `https://drive.google.com/file/d/${fileId}/view?usp=sharing` })
        });
        if (response.ok) {
            console.log('Record added successfully');
        } else {
            console.error('Failed to add record');
        }
    } catch (error) {
        console.error('Error adding record to database:', error);
    }
}