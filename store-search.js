Medicines = new Mongo.Collection("medicines");

if (Meteor.isClient) {
  Template.medicinesList.helpers({
    medicines: function () {
      if (Session.get("medicinesList") !== undefined) {
        return Session.get("medicinesList");
      }

      return Medicines.find({}, { sort: { name: 1 }, limit: 15 });
    }
  });

  Template.fileUploadForm.events({
    'click #upload-button': function () {
      var config, i, medicineDetails, key;

      if ($("#file-input")[0].files.length === 0) {
        alert("Please choose a file to upload.");
        return;
      }
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

  Template.body.events({
    'submit .search-form, input #search-box': function (event) {
      var searchTerm;

      event.preventDefault();

      searchTerm = $("#search-box")[0].value;
      console.log("Your search term: " + searchTerm);
      Session.set("searchTerm", searchTerm);

      if (searchTerm.length > 0) {
        searchTerm = new RegExp(searchTerm, 'i');
        Session.set("medicinesList", Medicines.find({ name: searchTerm }).fetch());
      } else {
        Session.set("medicinesList", undefined);
      }

      console.log("Search results: ");
      console.log(Session.get("medicinesList"));
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
