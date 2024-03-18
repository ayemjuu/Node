




  const video = document.getElementById('video');
  let stream = null;

  document.getElementById('startBtn').addEventListener('click', startCamera);
  document.getElementById('stopBtn').addEventListener('click', stopCamera);
  document.getElementById('qrFileInput').addEventListener('change', loadQRFile);

  // Existing event listeners are assumed to be present in script.js

  document.getElementById('doneBtn').addEventListener('click', removeFile);


  function startCamera() {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          .then(str => {
              stream = str;
              video.srcObject = stream;
              video.play();
              document.getElementById('startBtn').style.display = 'none';
              document.getElementById('stopBtn').style.display = 'inline-block';
              document.getElementById('qrFileInput').value = '';
          
              
              scanQRCode();
          })
          .catch(err => console.error('getUserMedia error:', err));
  }

  function stopCamera() {
      if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
          video.srcObject = null;
          document.getElementById('startBtn').style.display = 'inline-block';
          document.getElementById('stopBtn').style.display = 'none';
      
      }
  }

  // Close the modal when the close button is clicked
const closeModal = document.querySelector('.modal .close');
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Close the modal when the user clicks outside of it
window.addEventListener('click', event => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});



function scanQRCode() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    video.addEventListener('loadedmetadata', function() {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const scan = () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                try {
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    if (code) {
                        console.log('QR code detected:', code.data);
                        // Extracting and displaying only name and license plate number
                        const resultDiv = document.getElementById('result');
                        const parsedData = JSON.parse(code.data);
                        const name = parsedData.name;
                        const plateNumber = parsedData.plateNumber;
                        // resultDiv.innerText = `Name: ${name} \plateNumber: ${plateNumber}`;
                        // Stop the camera
                        stopCamera();

                        // Displaying modal with scanned data and IDs
                        modalData.innerHTML = `<br><br><div id="idListContainer" style="max-height: 200px;"><ul id="idList" style="list-style-type: none;"></ul></div>`;

                        // Get the current date
                        const currentDate = new Date();
                        const currentDay = currentDate.getDate();

                        // Query Firestore to get IDs based on name and plate number
                        db.collection('acceptedRequest')
                            .where('driverName', '==', name)
                            .where('driverPlateNumber', '==', plateNumber)
                            .get()
                            .then(querySnapshot => {
                                const idList = document.getElementById('idList');
                                idList.innerHTML = ''; // Clear the list before adding filtered items
                                let found = false;
                                querySnapshot.forEach(doc => {
                                    let timeAccepted = doc.data().timeAccepted;
                                    if (!(timeAccepted instanceof Date)) {
                                        timeAccepted = timeAccepted.toDate(); // Convert Firestore timestamp to JS Date object
                                    }
                                    const acceptedDay = timeAccepted.getDate();
                                    if (currentDay === acceptedDay) { // Filter items by day
                                        const formattedTimeAccepted = formatTimestamp(timeAccepted);
                                        const successful = doc.data().successful ? 'Successful' : 'Unsuccessful';
                                        if (successful === 'Unsuccessful') { // Check if the request was unsuccessful
                                            const listItem = document.createElement('li');
                                            // Make the list item clickable
                                            // listItem.style.cursor = 'pointer';
                                            // listItem.textContent = `ID: ${doc.id}, Name: ${name}, Plate Number: ${plateNumber}, Time Accepted: ${formattedTimeAccepted}, Successful: ${successful}, Pickup Point: ${doc.data().pickupPoint}, Drop-off Point: ${doc.data().dropOffPoint}, Requested By: ${doc.data().requestBy}, Requester's Contact Number: ${doc.data().requestByContactNumber}`;
                                            listItem.innerHTML = `<span class="hide">ID: ${doc.id}</span><br>Driver Name: ${name}<br>TODA Number: ${plateNumber}<br>Time requested: ${doc.data().timeRequested}<br>Time Accepted: ${formattedTimeAccepted}<br>Pickup Point: ${doc.data().pickupPoint}<br>Drop-off Point: ${doc.data().dropOffPoint}<br>Requested By: ${doc.data().requestBy}<br><span class="hide">Requester's Contact Number: ${doc.data().requestByContactNumber}</span>`;
                                            listItem.classList.add('list-item');

                                            // Add click event to display more details if needed
                                            listItem.addEventListener('click', () => {
                                                // You can define your logic here to display more details when clicked
                                                console.log(`Clicked ID: ${doc.id}`);
                                            });
                                            idList.appendChild(listItem);
                                            found = true;
                                        }
                                    }
                                });
                                if (!found) {
                                    // If no documents found, display "No ongoing Ride" message
                                    const noRideMessage = document.createElement('li');
                                    noRideMessage.textContent = 'You have no ongoing Ride';
                                    noRideMessage.classList.add('no-ride-message');
                                    idList.appendChild(noRideMessage);

                                    // Hide the fake book button
                                    document.getElementById('report').style.display = 'none';
                                    // Hide the ride details paragraph
                                    document.querySelector('.ride-details').style.display = 'none';
                                } else {
                                    // Show the fake book button
                                    document.getElementById('report').style.display = 'block';
                                    // Show the ride details paragraph
                                    document.querySelector('.ride-details').style.display = 'block';
                                }
                            })
                            .catch(error => {
                                console.error('Error getting documents: ', error);
                            });

                        // Display the modal
                        modal.style.display = 'block';

                    }
                } catch (error) {
                    console.error('Error decoding QR code:', error);
                }
            }
            requestAnimationFrame(scan);
        };
        scan();
    });
}




//working ito kaso built in confirmation gamit

//confirmation

// const reportButton = document.getElementById('report');
// reportButton.addEventListener('click', handleReportButtonClick);



// function handleReportButtonClick() {
//     // Find the list item corresponding to the scanned QR code
//     const listItem = document.querySelector('#idList li');

//     // Extract the ID, driverName, and driverPlateNumber from the list item
//     if (listItem) {
//         const idMatch = listItem.innerHTML.match(/ID: (\w+)/); // Extracting the ID using regular expression
//         const driverNameMatch = listItem.innerHTML.match(/Driver Name: (.+?)<br>/); // Extracting the Driver Name
//         const driverPlateNumberMatch = listItem.innerHTML.match(/Plate Number: (.+?)<br>/); // Extracting the Plate Number
//         const requestByMatch = listItem.innerHTML.match(/Requested By: (.+?)<br>/); // Extracting the Requested By
//          const pickupPointMatch = listItem.innerHTML.match(/Pickup Point: (.+?)<br>/); // Extracting the Pickup Point
//          const dropOffPointMatch = listItem.innerHTML.match(/Drop-off Point: (.+?)<br>/);
//         //  const requesterContactMatch = listItem.innerHTML.match(/Requester's Contact Number: (.+?)<br>/);
//          const requesterContactMatch = listItem.innerHTML.match(/Requester's Contact Number: \+(\d+)/);
//          const timeRequestedMatch = listItem.innerHTML.match(/Time requested: (.+?)<br>/); // Extracting the Time requested
//          const timeAcceptedMatch = listItem.innerHTML.match(/Time Accepted: (.+?)<br>/); // Extracting the Time accepted

//          console.log("Contact Number Match:", requesterContactMatch);
//          console.log("List Item HTML:", listItem.innerHTML);
         
//         if (idMatch && driverNameMatch && driverPlateNumberMatch && requestByMatch && pickupPointMatch && dropOffPointMatch && requesterContactMatch && timeRequestedMatch && timeAcceptedMatch) {
//             const id = idMatch[1];
//             const driverName = driverNameMatch[1];
//             const driverPlateNumber = driverPlateNumberMatch[1];
//             const requestBy = requestByMatch[1];
//             const pickupPoint = pickupPointMatch[1];
//             const dropOffPoint = dropOffPointMatch[1];
//             const requesterContactNumber = requesterContactMatch[1];
//             const timeRequested = timeRequestedMatch[1];
//             const timeAccepted = timeAcceptedMatch[1];

//             // Ask for confirmation before reporting
//             const confirmed = confirm(`Are you sure you want to report ID: ${id} as a fake booking?`);
//             if (confirmed) {
//                 // The user confirmed, proceed with the report
//                 console.log(`Reported ID: ${id} for Driver Name: ${driverName}, Plate Number: ${driverPlateNumber}, and Requested By: ${requestBy}`);

//                 // Update the document in Firestore
//                 db.collection('acceptedRequest').doc(id).update({
//                         successful: true
//                     })
//                     .then(() => {
//                         console.log(`Document with ID ${id} successfully updated.`);

//                         // Save the report data to Firestore
//                         return db.collection('Report').add({
//                             reportedBy: driverName,
//                             reported: requestBy,
//                             timeReported: new Date(),
//                             report: "Fake Booking",
//                         });
//                     })
//                     .then((docRef) => {
//                         console.log('Report data successfully saved to Firestore.');

//                         // Save the report data to history collection
//                         return db.collection('history').add({
//                             reportId: docRef.id,
//                             driverName: driverName,
//                             requestBy: requestBy,
//                             rideEnded: new Date(),
//                             report: "Fake Booking",
//                             pickupPoint: pickupPoint,
//                             dropOffPoint: dropOffPoint,
//                             driverPlateNumber: driverPlateNumber,
//                             // requestByContactNumber: requesterContactNumber
//                             requestByContactNumber: "+" + requesterContactNumber,
//                             timeRequested: timeRequested,
//                             timeAccepted: timeAccepted

//                         });
//                     })
//                     .then(() => {
//                         console.log('Report data successfully saved to history collection.');

//                         // Close the modal
//                         modal.style.display = 'none';
//                     })
//                     .catch(error => {
//                         console.error(`Error updating document with ID ${id} or saving report data to Firestore:`, error);
//                     });
//             } else {
//                 // The user canceled, do nothing
//                 console.log('Report canceled by the user.');
//             }
//         } else {
//             console.log('Failed to extract necessary information from the QR code data.');
//         }
//     } else {
//         console.log('No scanned QR code data available to report.');
//     }
// }



//end nung buil;t-in confirmation


//di na siya buil-in confirmation

// const reportButton = document.getElementById('report');
// const confirmationModal = document.getElementById('confirmationModal');
// const confirmReportButton = document.getElementById('confirmReport');
// const cancelReportButton = document.getElementById('cancelReport');

// reportButton.addEventListener('click', handleReportButtonClick);

// function handleReportButtonClick() {


//     // Find the list item corresponding to the scanned QR code
//     const listItem = document.querySelector('#idList li');

//     // Extract the ID, driverName, and driverPlateNumber from the list item
//     if (listItem) {
//         const idMatch = listItem.innerHTML.match(/ID: (\w+)/); // Extracting the ID using regular expression
//         const driverNameMatch = listItem.innerHTML.match(/Driver Name: (.+?)<br>/); // Extracting the Driver Name
//         const driverPlateNumberMatch = listItem.innerHTML.match(/Plate Number: (.+?)<br>/); // Extracting the Plate Number
//         const requestByMatch = listItem.innerHTML.match(/Requested By: (.+?)<br>/); // Extracting the Requested By
//         const pickupPointMatch = listItem.innerHTML.match(/Pickup Point: (.+?)<br>/); // Extracting the Pickup Point
//         const dropOffPointMatch = listItem.innerHTML.match(/Drop-off Point: (.+?)<br>/); // Extracting the Drop-off Point
//         const requesterContactMatch = listItem.innerHTML.match(/Requester's Contact Number: \+(\d+)/); // Extracting the Requester's Contact Number
//         const timeRequestedMatch = listItem.innerHTML.match(/Time requested: (.+?)<br>/); // Extracting the Time requested
//         const timeAcceptedMatch = listItem.innerHTML.match(/Time Accepted: (.+?)<br>/); // Extracting the Time accepted

//         if (idMatch && driverNameMatch && driverPlateNumberMatch && requestByMatch && pickupPointMatch && dropOffPointMatch && requesterContactMatch && timeRequestedMatch && timeAcceptedMatch) {
//             const id = idMatch[1];
//             const driverName = driverNameMatch[1];
//             const driverPlateNumber = driverPlateNumberMatch[1];
//             const requestBy = requestByMatch[1];
//             const pickupPoint = pickupPointMatch[1];
//             const dropOffPoint = dropOffPointMatch[1];
//             const requesterContactNumber = requesterContactMatch[1];
//             const timeRequested = timeRequestedMatch[1];
//             const timeAccepted = timeAcceptedMatch[1];

//             // Show the confirmation modal
//             confirmationModal.style.display = 'block';

//             // When the confirm button in the modal is clicked
//             confirmReportButton.addEventListener('click', function () {
//                 // Hide the modal
//                 confirmationModal.style.display = 'none';
//                 //   modal.style.display = 'none';

//                 // Proceed with reporting
//                 console.log(`Reported ID: ${id} for Driver Name: ${driverName}, Plate Number: ${driverPlateNumber}, and Requested By: ${requestBy}`);

//                 // Update the document in Firestore
//                 db.collection('acceptedRequest').doc(id).update({
//                     successful: true
//                 })
//                 .then(() => {
//                     console.log(`Document with ID ${id} successfully updated.`);

//                     // Save the report data to Firestore
//                     return db.collection('Report').add({
//                         reportedBy: driverName,
//                         reported: requestBy,
//                         timeReported: new Date(),
//                         report: "Fake Booking",
//                     });
//                 })
//                 .then((docRef) => {
//                     console.log('Report data successfully saved to Firestore.');

//                     // Save the report data to history collection
//                     return db.collection('history').add({
//                         reportId: docRef.id,
//                         driverName: driverName,
//                         requestBy: requestBy,
//                         rideEnded: new Date(),
//                         report: "Fake Booking",
//                         pickupPoint: pickupPoint,
//                         dropOffPoint: dropOffPoint,
//                         driverPlateNumber: driverPlateNumber,
//                         requestByContactNumber: "+" + requesterContactNumber,
//                         timeRequested: timeRequested,
//                         timeAccepted: timeAccepted
//                     });
//                 })
//                 .then(() => {
//                     console.log('Report data successfully saved to history collection.');
//                 })
//                 .catch(error => {
//                     console.error(`Error updating document with ID ${id} or saving report data to Firestore:`, error);
//                 });
//             });

//             // When the cancel button in the modal is clicked
//             cancelReportButton.addEventListener('click', function () {
//                 // Hide the modal
//                 confirmationModal.style.display = 'none';

//                 // Log that the report was canceled
//                 console.log('Report canceled by the user.');
//             });

//         } else {
//             console.log('Failed to extract necessary information from the QR code data.');
//         }
//     } else {
//         console.log('No scanned QR code data available to report.');
//     }
// }
//until here



const reportButton = document.getElementById('report');
const confirmationModal = document.getElementById('confirmationModal');
const confirmReportButton = document.getElementById('confirmReport');
const cancelReportButton = document.getElementById('cancelReport');

// Add event listeners to confirm and cancel buttons outside the handleReportButtonClick function
confirmReportButton.addEventListener('click', handleConfirmReportButtonClick);
cancelReportButton.addEventListener('click', handleCancelReportButtonClick);

let id, driverName, driverPlateNumber, requestBy, pickupPoint, dropOffPoint, requesterContactNumber, timeRequested, timeAccepted;

// Function to handle confirm button click
function handleConfirmReportButtonClick() {
    // Hide the modal
    confirmationModal.style.display = 'none';
    modal.style.display = 'none';


    // Proceed with reporting
    console.log(`Reported ID: ${id} for Driver Name: ${driverName}, Plate Number: ${driverPlateNumber}, and Requested By: ${requestBy}`);

    // Update the document in Firestore
    db.collection('acceptedRequest').doc(id).update({
            successful: true
        })
        .then(() => {
            console.log(`Document with ID ${id} successfully updated.`);

            // Save the report data to Firestore
            return db.collection('Report').add({
                reportedBy: driverName,
                reported: requestBy,
                timeReported: new Date(),
                report: "Fake Booking",
                todaPlateNumber: driverPlateNumber,

            });
        })


        
        .then((docRef) => {
            console.log('Report data successfully saved to Firestore.');

           


            // Save the report data to history collection
            return db.collection('history').add({
                reportId: docRef.id,
                driverName: driverName,
                requestBy: requestBy,
                rideEnded: new Date(),
                report: "Fake Booking",
                pickupPoint: pickupPoint,
                dropOffPoint: dropOffPoint,
                driverPlateNumber: driverPlateNumber,
                requestByContactNumber: "+" + requesterContactNumber,
                timeRequested: timeRequested,
                timeAccepted: timeAccepted,

                // timeAccepted: formattedTimeAccepted,
            });
        })

        .then(() => {
            console.log('Report data successfully saved to history collection.');
                // Get current date and time
            const currentDate = new Date();

            // Save the priority data to the "Priority" collection
            return db.collection('Priority').add({
                driverName: driverName,
                driverPlateNumber: driverPlateNumber,
                date: currentDate // Add the current date
            });
        })


        .then(() => {
            console.log('Report data successfully saved to history collection.');
            console.log('Value of timeAccepted:', timeAccepted); 
        })
        .catch(error => {
            console.error(`Error updating document with ID ${id} or saving report data to Firestore:`, error);
        });
}



// Function to handle cancel button click
function handleCancelReportButtonClick() {
    // Hide the modal
    confirmationModal.style.display = 'none';


    // Log that the report was canceled
    console.log('Report canceled by the user.');
}

// Event listener for report button
reportButton.addEventListener('click', handleReportButtonClick);

// Function to handle report button click
function handleReportButtonClick() {
    // Find the list item corresponding to the scanned QR code
    const listItem = document.querySelector('#idList li');

    // Extract the ID, driverName, and driverPlateNumber from the list item
    if (listItem) {
        const idMatch = listItem.innerHTML.match(/ID: (\w+)/); // Extracting the ID using regular expression
        const driverNameMatch = listItem.innerHTML.match(/Driver Name: (.+?)<br>/); // Extracting the Driver Name
        const driverPlateNumberMatch = listItem.innerHTML.match(/TODA Number: (.+?)<br>/); // Extracting the Plate Number
        const requestByMatch = listItem.innerHTML.match(/Requested By: (.+?)<br>/); // Extracting the Requested By
        const pickupPointMatch = listItem.innerHTML.match(/Pickup Point: (.+?)<br>/); // Extracting the Pickup Point
        const dropOffPointMatch = listItem.innerHTML.match(/Drop-off Point: (.+?)<br>/); // Extracting the Drop-off Point
        const requesterContactMatch = listItem.innerHTML.match(/Requester's Contact Number: \+(\d+)/); // Extracting the Requester's Contact Number
        const timeRequestedMatch = listItem.innerHTML.match(/Time requested: (.+?)<br>/); // Extracting the Time requested
        const timeAcceptedMatch = listItem.innerHTML.match(/Time Accepted: (.+?)<br>/); // Extracting the Time accepted

        if (idMatch && driverNameMatch && driverPlateNumberMatch && requestByMatch && pickupPointMatch && dropOffPointMatch && requesterContactMatch && timeRequestedMatch && timeAcceptedMatch) {
            id = idMatch[1];
            driverName = driverNameMatch[1];
            driverPlateNumber = driverPlateNumberMatch[1];
            requestBy = requestByMatch[1];
            pickupPoint = pickupPointMatch[1];
            dropOffPoint = dropOffPointMatch[1];
            requesterContactNumber = requesterContactMatch[1];
            timeRequested = timeRequestedMatch[1];
            timeAccepted = timeAcceptedMatch[1];
          

            // Show the confirmation modal
            confirmationModal.style.display = 'block';
        } else {
            console.log('Failed to extract necessary information from the QR code data.');
        }
    } else {
        console.log('No scanned QR code data available to report.');
    }
}



//hehe
  function loadQRFile(event) {
      const file = event.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = function() {
              const img = new Image();
              img.onload = function() {
                  const canvas = document.createElement('canvas');
                  const context = canvas.getContext('2d');
                  canvas.width = img.width;
                  canvas.height = img.height;
                  context.drawImage(img, 0, 0, img.width, img.height);
                  try {
                      const imageData = context.getImageData(0, 0, img.width, img.height);
                      const code = jsQR(imageData.data, imageData.width, imageData.height);
                      if (code) {
                          console.log('QR code detected:', code.data);
                          // Extracting and displaying only name and license plate number
                          const resultDiv = document.getElementById('result');
                          const parsedData = JSON.parse(code.data);
                          const name = parsedData.name;
                          const plateNumber = parsedData.plateNumber;
                          resultDiv.innerText = `Name: ${name} \plateNumber : ${plateNumber}`;
                      } else {
                          alert('No QR Code detected in the image.');
                      }
                  } catch (error) {
                      console.error('Error processing QR code image:', error);
                  }
              };
              img.onerror = function() {
                  console.error('Error loading image:', img.src);
              };
              img.src = reader.result;
          };
          reader.readAsDataURL(file);
      }
  }

  function removeFile() {
      document.getElementById('qrFileInput').value = '';

      const resultDiv = document.getElementById('result');
      resultDiv.innerText = '';
  }



// Initialize Firebase
const firebaseConfig = {

    //TodaHero
    // apiKey: "AIzaSyDjBboCs4iqBnogiInGpHcVvCEDBGokiLU",
    // authDomain: "thero-28f02.firebaseapp.com",
    // projectId: "thero-28f02",
    // storageBucket: "thero-28f02.appspot.com",
    // messagingSenderId: "394557839181",
    // appId: "1:394557839181:web:53a1bf1d15264d3ab74904",
    // measurementId: "G-MB5NB4LDS3"

    //THero
    apiKey: "AIzaSyAsg1oW1wpZXUcZo0UcFZ57qYWBAJHfasY",
    authDomain: "todahero-4e7c0.firebaseapp.com",
    projectId: "todahero-4e7c0",
    storageBucket: "todahero-4e7c0.appspot.com",
    messagingSenderId: "617421997910",
    appId: "1:617421997910:web:aca4e6fc791b36393d38f7",
    measurementId: "G-B2P699P8YS"


  };
  
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();


// Function to format timestamp
// Function to format timestamp
// function formatTimestamp(timestamp) {
//     const date = timestamp.toDate();
//     const options = { 
//       year: 'numeric', 
//       month: 'long', 
//       day: 'numeric', 
//       hour: 'numeric', 
//       minute: 'numeric', 
//       second: 'numeric', 
//       timeZone: 'UTC',
//       timeZoneName: 'short'
//     };
//     return new Intl.DateTimeFormat('en-US', options).format(date);
//   }
  
// Define the formatTimestamp function
// function formatTimestamp(timestamp) {
//     if (timestamp instanceof Date) {
//         // If it's already a Date object, format it accordingly
//         const hours = timestamp.getHours().toString().padStart(2, '0');
//         const minutes = timestamp.getMinutes().toString().padStart(2, '0');
//         const seconds = timestamp.getSeconds().toString().padStart(2, '0');
//         return `${hours}:${minutes}:${seconds}`;
//     } else if (timestamp && typeof timestamp.toDate === 'function') {
//         // If it's a Firestore timestamp, convert it to a Date object and then format it
//         const date = timestamp.toDate();
//         const hours = date.getHours().toString().padStart(2, '0');
//         const minutes = date.getMinutes().toString().padStart(2, '0');
//         const seconds = date.getSeconds().toString().padStart(2, '0');
//         return `${hours}:${minutes}:${seconds}`;
//     } else {
//         return 'Invalid Timestamp';
//     }
// }


function formatTimestamp(timestamp) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        // timeZoneName: 'short'
    };
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(timestamp);
    return formattedDate;
}


  // Function to fetch and log data from Firestore for the current day
  function logDataFromFirestoreForCurrentDay() {
    // Get current date
    const currentDate = new Date();
    const startOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const endOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
  
    // Query the Firestore collection for documents accepted today
    db.collection('acceptedRequest')
      .where('timeAccepted', '>=', startOfToday)
      .where('timeAccepted', '<', endOfToday)
      .get()
      .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          // Accessing each document's data
          const id = doc.id;
          const data = doc.data();
          const driverName = data.driverName;
          const driverPlateNumber = data.driverPlateNumber;
          const timeAccepted = data.timeAccepted;
  
          // Formatting timestamp
          const formattedTimeAccepted = formatTimestamp(timeAccepted);
          
          // Logging data to the console
          console.log('ID:', id);
          console.log('Driver Name:', driverName);
          console.log('Driver Plate Number:', driverPlateNumber);
          console.log('Time Accepted:', formattedTimeAccepted);
        });
      })
      .catch(error => {
        console.error('Error getting documents: ', error);
      });
  }
  








  // Call the function to log data for the current day when needed
  logDataFromFirestoreForCurrentDay();




  // Function to update date and time dynamically
function updateDateTime() {
    const datetimeContainer = document.getElementById('datetimeContainer');
    const currentDate = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    const formattedDateTime = currentDate.toLocaleDateString('en-US', options);
    datetimeContainer.textContent = formattedDateTime;
  }

  // Update date and time initially
updateDateTime();



const fullscreenImg = document.getElementById('fullscreenImg');

// Function to toggle fullscreen mode
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        fullscreenImg.src = 'images/minimize.png';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            fullscreenImg.src = 'images/fullscreen.png';
        }
    }
}

// Event listener for the image click
fullscreenImg.addEventListener('click', toggleFullscreen);






// Get the modal element
const fakeBookModal = document.getElementById('fakeBookModal');

// Get the button that opens the modal
// const reportButton = document.getElementById('report');

// Get the <span> element that closes the modal
const closeFakeBookModal = fakeBookModal.querySelector('.close');

// When the user clicks the button, open the modal
reportButton.addEventListener('click', function() {
  fakeBookModal.style.display = 'block';
});

// When the user clicks on <span> (x), close the modal
closeFakeBookModal.addEventListener('click', function() {
  fakeBookModal.style.display = 'none';
});

// When the user clicks anywhere outside of the modal, close it
window.addEventListener('click', function(event) {
  if (event.target === fakeBookModal) {
    fakeBookModal.style.display = 'none';
  }
});
