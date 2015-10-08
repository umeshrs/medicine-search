Medicines = new Mongo.Collection("medicines");

if (Meteor.isClient) {
  Template.medicinesList.helpers({
    medicines: function () {
      return Medicines.find({});
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
