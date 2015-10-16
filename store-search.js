Medicines = new Mongo.Collection("medicines");
Stores = new Mongo.Collection("stores");

if (Meteor.isClient) {
  Template.body.helpers({
    settings: function () {
      return {
        position: "bottom",
        limit: 10,
        rules: [
          {
            collection: Medicines,
            field: "name",
            matchAll: true,
            template: Template.medicine
          }
        ]
      };
    }
  });
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
      if (Session.get("storesList") === undefined) {
        Session.set("storesList", null);
      }
      if (Session.get("storesList") !== null) {
        return Session.get("storesList");
      }

      // return Stores.find({}, {sort: {createdAt: 1}});
      return [];
    }
  });

  Template.fileUploadForm.events({
    'click #upload-button': function () {
      var config, i, medicineDetails, key, storeDetails, name, purpose, inventory;

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
            storeDetails = results.data[i];

            Stores.insert({
              name: storeDetails['storeName'],
              createdAt: new Date()
            });
          }

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

      config.complete = function (results) {
        console.log(results);

        for (i = 0; i < results.data.length; i++) {
          medicineDetails = results.data[i];
          inventory = [];
          for (key in medicineDetails) {
            switch (key) {
              case "medicineName":
                name = medicineDetails[key];
                break;
              case "purpose":
                purpose = medicineDetails[key];
                break;
              default:
                if (medicineDetails[key]) {
                  // console.log(key);
                  // console.log(medicineDetails[key]);
                  storeDetails = Stores.findOne({ name: key });
                  // console.log(storeDetails);
                  inventory.push({
                    store_id: storeDetails._id,
                    storeName: key,
                    stock: medicineDetails[key]
                  });
                  // console.log(inventory);
                }
            }
          }

          Medicines.insert({
            name: name,
            purpose: purpose,
            inventory: inventory,
            createdAt: new Date()
          });
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
    }
  });

  Template.prescription.events({
    'click .delete': function () {
      event.target.parentElement.parentElement.parentElement.remove();
    }
  });

  Template.body.events({
    'input #search-box': function (event) {
      var searchTerm;

      searchTerm = $("#search-box")[0].value;
      // console.log("Your search term: " + searchTerm);
      Session.set("searchTerm", searchTerm);

      if (searchTerm.length > 0) {
        searchTerm = new RegExp(searchTerm, 'i');
        // medicinesList is the list of medicines matching the searchTerm
        Session.set("medicinesList", Medicines.find({ name: searchTerm }).fetch());
      } else {
        Session.set("medicinesList", null);
      }

      // console.log("Search results: ", Session.get("medicinesList"));
    },
    'submit .search-form': function () {
      var prescription, medicinesList, isValidName, index, i, medicineDetails, matchedStores, j, storeName, isPresent, quantity;

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

        if (prescription.length > 0) {
          medicineDetails = Medicines.findOne({ name: prescription[0].name });
          matchedStores = medicineDetails.inventory;
          for (i = 0; i < matchedStores.length; i++) {
            matchedStores[i].stock = [{ medicineName: medicineDetails.name, quantity: matchedStores[i].stock }];
          }
          console.log(matchedStores);
          for (i = 1; i < prescription.length; i++) {
            medicineDetails = Medicines.findOne({ name: prescription[i].name });
            for (j = 0; j < matchedStores.length; j++) {
              isPresent = medicineDetails.inventory.some(function (element, index) {
                if (element.storeName === matchedStores[j].storeName) {
                  quantity = element.stock;
                  return true;
                }
              });
              if (isPresent) {
                matchedStores[j].stock.push({ medicineName: medicineDetails.name, quantity: quantity });
              }
              else {
                matchedStores.splice(j, 1);
                j--;  // all elements after index j are shifted left by 1 after the splice
              }
            }
            console.log(matchedStores);
            // console.log(medicineDetails.name);
            // console.log(medicineDetails.inventory);
          }
          Session.set("storesList", matchedStores);
        }

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
