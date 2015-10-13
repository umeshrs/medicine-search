Medicines = new Mongo.Collection("medicines");

if (Meteor.isClient) {
  Template.medicinesList.helpers({
    medicines: function () {
      return Medicines.find({}, { sort: { name: 1 } });
    }
  });

  Template.fileUploadForm.events({
    'click #upload-button': function () {
      var config, i, medicineDetails, key;

      config = {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function (results) {
          console.log(results);

          for (i = 0; i < results.data.length; i++) {
            medicineDetails = results.data[i];

            Medicines.insert({
              name: medicineDetails['medicineName'],
              purpose: medicineDetails['purpose'],
              createdAt: new Date()
            });
          }

        }
      };

      $('#file-input').parse({
        config: config,
        before: function (file, inputElem) {
          console.log("Parsing file...", file);
        },
        error: function (err, file) {
          console.log("ERROR:", err, file);
        },
        complete: function (results) {
          console.log("Parsing complete.");
        }
      });
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
