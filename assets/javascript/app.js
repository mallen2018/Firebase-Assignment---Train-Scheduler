$(document).ready(function(){
  
    // Initialize Firebase
    var config = {
      apiKey: "AIzaSyD1sODfharvwCm3_tINIVcY7kthz-jhvPo",
      authDomain: "train-schedule-p-1530746096464.firebaseapp.com",
      databaseURL: "https://train-schedule-p-1530746096464.firebaseio.com",
      projectId: "train-schedule-p-1530746096464",
      storageBucket: "train-schedule-p-1530746096464.appspot.com",
      messagingSenderId: "271924179154"
    };
    firebase.initializeApp(config);
  
    
      //Run Clock  
      setInterval(function(){
        $('.current-time').html(moment().format('hh:mm:ss A'))
      }, 1000);
    
    
      $('.content').hide();
    
      //  popup for authorization
      var provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
    
      $(document).on('click', '.signIn', function() {
        firebase.auth().signInWithPopup(provider).then(function(result) {
         // Google Access Token.
         var token = result.credential.accessToken;
         // The signed-in user info.
         var user = result.user;
         $('.content').show();
         loggedIn();
         
        });
        $(this).removeClass('signIn')
          .addClass('signOut')
          .html('Sign Out Of Google');
      });
    
      $(document).on('click', '.signOut', function () {
        firebase.auth().signOut().then(function() {
          $('.content').hide();
        }, function(error) {
          // An error happened.
        });
        $(this).removeClass('signOut')
          .addClass('signIn')
          .html('Sign In With Google To See Schedule');
      });
    
    
    
      function loggedIn() {
    
        // Declare variables
        var dataRef = firebase.database();
        var editTrainKey = '';
        var fbTime = moment();
        var newTime;
    
        $('.submit').on('click', function(e) {
    
          e.preventDefault();
          // Grab input values
          var trainName = $('#trainName').val().trim();
          var trainDestination = $('#trainDestination').val().trim();
     
          var trainTime = moment($('#firstTrain').val().trim(),"HH:mm").format("X");
          var trainFreq = $('#trainFrequency').val().trim();
    
          if (trainName != '' && trainDestination != '' && trainTime != '' && trainFreq != '') {
            // Clear form data
            $('#trainName').val('');
            $('#trainDestination').val('');
            $('#firstTrain').val('');
            $('#trainFrequency').val('');
            $('#trainKey').val('');
    
            fbTime = moment().format('X');
            // Push to firebase
            if (editTrainKey == ''){ 
              dataRef.ref().child('trains').push({
                trainName: trainName,
                trainDestination: trainDestination,
                trainTime: trainTime,
                trainFreq: trainFreq,
                currentTime: fbTime,
              })
            } else if (editTrainKey != '') {
              dataRef.ref('trains/' + editTrainKey).update({
                trainName: trainName,
                trainDestination: trainDestination,
                trainTime: trainTime,
                trainFreq: trainFreq,
                currentTime: fbTime,
              })
              editTrainKey = '';
            }
            $('.help-block').removeClass('bg-danger');
          } else {
            $('.help-block').addClass('bg-danger');
          }
    
        });
    
        // Update minutes away by triggering change in firebase children
        function timeUpdater() {
          dataRef.ref().child('trains').once('value', function(snapshot){
            snapshot.forEach(function(childSnapshot){
              fbTime = moment().format('X');
              dataRef.ref('trains/' + childSnapshot.key).update({
              currentTime: fbTime,
              })
            })    
          });
        };
    
        setInterval(timeUpdater, 10000);
    
    
        // Reference Firebase when page loads and train added
        dataRef.ref().child('trains').on('value', function(snapshot){
          $('tbody').empty();
          
          snapshot.forEach(function(childSnapshot){
            var trainClass = childSnapshot.key;
            var trainId = childSnapshot.val();
            var firstTimeConverted = moment.unix(trainId.trainTime);
            var timeDiff = moment().diff(moment(firstTimeConverted, 'HH:mm'), 'minutes');
            var timeDiffCalc = timeDiff % parseInt(trainId.trainFreq);
            var timeDiffTotal = parseInt(trainId.trainFreq) - timeDiffCalc;
    
            if(timeDiff >= 0) {
              newTime = null;
              newTime = moment().add(timeDiffTotal, 'minutes').format('hh:mm A');
    
            } else {
              newTime = null;
              newTime = firstTimeConverted.format('hh:mm A');
              timeDiffTotal = Math.abs(timeDiff - 1);
            }
    
            $('tbody').append("<tr class=" + trainClass + "><td>" + trainId.trainName + "</td><td>" +
              trainId.trainDestination + "</td><td>" + 
              trainId.trainFreq + "</td><td>" +
              newTime + "</td><td>" +
              timeDiffTotal + "</td><td><button class='edit btn' data-train=" + trainClass + "> Edit </button> <button class='delete btn' data-train=" + trainClass + "> Delete </button></td></tr>");
    
        });
        }, function(errorObject) {
            console.log("Errors handled: " + errorObject.code);
        });
    
         // Reference Firebase when children are updated
        dataRef.ref().child('trains').on('child_changed', function(childSnapshot){
          
          var trainClass = childSnapshot.key;
          var trainId = childSnapshot.val();
          var firstTimeConverted = moment.unix(trainId.trainTime);
          var timeDiff = moment().diff(moment(firstTimeConverted, 'HH:mm'), 'minutes');
          var timeDiffCalc = timeDiff % parseInt(trainId.trainFreq);
          var timeDiffTotal = parseInt(trainId.trainFreq) - timeDiffCalc;
    
          if(timeDiff > 0) {
            newTime = moment().add(timeDiffTotal, 'minutes').format('hh:mm A');
          } else {
            newTime = firstTimeConverted.format('hh:mm A');
            timeDiffTotal = Math.abs(timeDiff - 1);
          } 
    
          $('.'+trainClass).html("<td>" + trainId.trainName + "</td><td>" +
            trainId.trainDestination + "</td><td>" + 
            trainId.trainFreq + "</td><td>" +
            newTime + "</td><td>" +
            timeDiffTotal + "</td><td><button class='edit btn' data-train=" + trainClass + "> Edit </button><button class='delete btn' data-train=" + trainClass + "> Delete </i></button></td>");
    
        }, function(errorObject) {
            console.log("Errors handled: " + errorObject.code);
        });
    
    
        $(document).on('click','.delete', function(){
          var trainKey = $(this).attr('data-train');
          dataRef.ref("trains/" + trainKey).remove();
          $('.'+ trainKey).remove();
        });
    
        $(document).on('click','.edit', function(){
          editTrainKey = $(this).attr('data-train');
          dataRef.ref("trains/" + editTrainKey).once('value').then(function(childSnapshot) {
            $('#trainName').val(childSnapshot.val().trainName);
            $('#trainDestination').val(childSnapshot.val().trainDestination);
            $('#firstTrain').val(moment.unix(childSnapshot.val().trainTime).format('HH:mm'));
            $('#trainFrequency').val(childSnapshot.val().trainFreq);
            $('#trainKey').val(childSnapshot.key);
    
          });
          
        });
    
      };
    
    });