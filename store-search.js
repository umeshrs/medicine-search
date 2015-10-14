Medicines = new Mongo.Collection("medicines");
Stores = new Mongo.Collection("stores");

if (Meteor.isClient) {
  Template.medicinesList.helpers({
    medicines: function () {
      if (Session.get("medicinesList") === undefined) {
        Session.set("medicinesList", null);
      }
      if (Session.get("medicinesList") !== null) {
        return Session.get("medicinesList");
      }

      return Medicines.find({}, { sort: { name: 1 }, limit: 15 });
    }
  });

  Template.prescription.helpers({
    medicines: function () {
      if (Session.get("prescription") === undefined) {
        Session.set("prescription", []);
      }
      return Session.get("prescription");
    }
  });

  Template.storesList.helpers({
    stores: function () {
      return Stores.find({}, {sort: {createdAt: 1}});
    }
  });

  Template.fileUploadForm.events({
    'click #upload-button': function () {
      var config, i, medicineDetails, key, storeDetails;

      if ($("#medicine-file-input")[0].files.length === 0) {
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

      $('#medicine-file-input').parse({
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

      config.complete = function (results) {
        console.log(results);

        for (i = 0; i < results.data.length; i++) {
          storeDetails = results.data[i];

          Stores.insert({
            name: storeDetails['storeName'],
            createdAt: new Date()
          });
        }
      };

      $('#store-file-input').parse({
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
    'input #search-box': function (event) {
      var searchTerm;

      searchTerm = $("#search-box")[0].value;
      console.log("Your search term: " + searchTerm);
      Session.set("searchTerm", searchTerm);

      if (searchTerm.length > 0) {
        searchTerm = new RegExp(searchTerm, 'i');
        // medicinesList is the list of medicines matching the searchTerm
        Session.set("medicinesList", Medicines.find({ name: searchTerm }).fetch());
      } else {
        Session.set("medicinesList", null);
      }

      console.log("Search results: ", Session.get("medicinesList"));
    },
    'submit .search-form': function () {
      var prescription, medicinesList, isValidName, index;

      event.preventDefault();

      medicinesList = Session.get("medicinesList");

      if (medicinesList === null) {
        alert("Please enter a medicine name.");
        return;
      }

      // checking if entered medicine name is equal to one of the names in the mathched medicines list
      isValidName = medicinesList.some(function (element, i) {
        if (element.name.toLowerCase() === $("#search-box")[0].value.toLowerCase()) {
          index = i;
          return true;
        }
      })
      if (isValidName) {
        prescription = Session.get("prescription");
        prescription.push({
          name: medicinesList[index].name,
          quantity: $("#quantity")[0].value
        });
        Session.set('prescription', prescription);

        // clear the text input
        $("#search-box")[0].value = "";
        $("#quantity")[0].value = "";
        $("#search-box")[0].focus();
        // clear search results
        Session.set('medicinesList', null);
      }
      else {
        console.log("The entered medicine is not in the database.");
        if (medicinesList.length > 0) {
          console.log("Did you mean " + medicinesList[0].name + "?");
        }
      }

    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
