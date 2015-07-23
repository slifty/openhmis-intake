$(function() {
  $(document).ready(function() {
    // minimum search length needed to start looking for matches.
    var minSearchLength = 1;

    // event handlers
    $("#searchField").keyup(function() {
      var userString = $("#searchField").val();
      if (userString.length >= minSearchLength) {
        populateResults(userString);
      }
      else if (userString.length == 0) {
        $("#results").empty(); // seems like this should have happened anyway, but it wasn't; look into it; also might want to shorten this comment.
      }
    });
    $("#results").on("click", ".hit", function(e) {
      switchToIntake($(e.currentTarget).data("entity-index"));
    });
    $("#addNewClient").click(function() {
      switchToIntake(-1);
    });
    $("#backToResults").click(function() {
      switchToSearch(true);
    });
    $("#saveChanges").click(function() {
      saveChanges();
      switchToSearch(false);
    });

    switchToSearch();
  });

  function populateResults(userString) {
    var newHits = search(userString);
    // Create an array to hold indices of all the latest hits. If an
    // old hit isn't found in here, it gets removed.
    var newHitIndices = [];
    for (var i=0; i<newHits.length; i++) {
      newHitIndices.push(newHits[i].entityIndex);
    }
    var oldHits = $("#results .hit");
    oldHits.each(function() {
      // Remember these are not objects of class Hit;
      // they're DOM elements (of class "hit").
      var oldHitIndex = $(this).data("entity-index");
      for (var i=newHits.length-1; i>=0; i--) {
        if (oldHitIndex == newHits[i]["entityIndex"]) {
          // There is already a <div> in the results field that
          // matches the one just returned; replace it with an
          // updated version (like a longer match string).
          $(this).empty();
          $(this).replaceWith(getSummaryDiv(newHits[i]));
          newHits.splice(i, 1); // remove the match from "newHits"
        }
      }
      // Finally, if the entity of an old hit is no longer
      // represented in new hits, mark it for removal from the
      // results area.
      if ($.inArray(oldHitIndex, newHitIndices) < 0) {
        $(this).addClass("removeMe");
      }
    });
    // Now remove from the "results" div...
    $("#results .hit.removeMe").remove();
    // And add all newHits...
    for (var i=0; i<newHits.length; i++) {
      $("#results").append(getSummaryDiv(newHits[i]));
    }
    // At this point, if "results" is empty, activate the "add new
    // client" button.
    if ($("#results > .hit").length == 0) {
      $("#addNewClient").prop("disabled", false);
    }
    // Otherwise deactivate it. This ensures that we can only add a
    // client when we're sure (s)he isn't already in the database.
    else {
      $("#addNewClient").prop("disabled", true);
    }
  }

  function Entity() {
  }

  function Hit(entity) {
    this.entityIndex = entity.index;
    this.removeMe = false; // Used when comparing to already-matched records.
    this.picture = entity.picture;
    this.firstName = entity.firstName;
    this.lastName = entity.lastName;
    this.sex = entity.sex.substr(0,1).toUpperCase();
    this.DOB = entity.DOB;
    this.age = entity.age;
    this.CID = entity.CID;
  }

  /* Hit factory holds a dictionary of hits (with entity indices as
     keys) that match user input. */
  function HitFactory() {
    this.hits = {};
  }

  HitFactory.prototype.getHit = function(entity) {
    var hit = null;
    var entityIndex = entity.index;
    if (this.hits.hasOwnProperty(entityIndex)) {
      hit = this.hits[entityIndex];
    }
    else {
      hit = new Hit(entity);
      this.hits[entityIndex] = hit;
    }
    return hit;
  }

  HitFactory.prototype.killHit = function(entity) {
    var entityIndex = entity.index;
    if (this.hits.hasOwnProperty(entityIndex)) {
      delete this.hits[entityIndex];
    }
  }

  HitFactory.prototype.allTheHits = function() {
    var hitList = [];
    for (entityIndex in this.hits) {
      hitList.push(this.hits[entityIndex]);
    }
    return hitList;
  }

  function search(userString) {
    // First Trim any non-alphanumerics from the ends of the user's input.
    userString = userString.replace(/^[^\w]+/i, "").replace(/[^\w]+$/i, "");

    // Then split the user's string on non-alphanumeric sequences. This
    // eliminates a dot after a middle initial, a comma if name is
    // entered as "Doe, John" (or as "Doe , John"), etc. 
    userSubstrings = userString.split(/[^\w]+/);

    // Store the first and second user substrings into some hidden form
    // fields. They might be used later if a new client is created.
    $("#searchForm #firstName").val(userSubstrings[0]);
    $("#searchForm #lastName").val(userSubstrings.length > 1 ? userSubstrings[1] : "");
    
    // The hit factory will generate new a Hit object or return an
    // already instantiated one with the requested index.
    var hitFactory = new HitFactory();

    var sampleDataLength = sampleData.length;
    var entity = null;
    var result = null;
    var matchLength = 0;
    var hit = null;

    // Turn the user's input into a list of regexes that will try to match against our matching terms.
    var userRegexes = $.map(userSubstrings, function(userSubstring) { return new RegExp("^" + userSubstring, "i"); });
    // This is the list of "matching terms" we will try to match to user input.
    var matchingTerms = ["firstName", "lastName", "CID"];

    for (var i=0; i<sampleDataLength; i++) {
      entity = sampleData[i];
      // Make a copies of "userRegexes" and "matchingTerms" that we can
      // alter as we search.
      var userRegexesCopy = userRegexes.slice(0);
      var matchingTermsCopy = matchingTerms.slice(0);
      while (userRegexesCopy.length > 0) {
        var userRegex = userRegexesCopy.shift();
        var matchFound = false;
        for (var j=0; j < matchingTermsCopy.length; ) {
          result = entity[matchingTermsCopy[j]].match(userRegex);
          if (result !== null) {
            // We found a match. Figure out how long it is.
            matchLength = result[0].length;
            // If the match is perfect OR if there are no more
            // user-entered search terms after this one, we may mark it
            // as a hit.
            if (matchLength == entity[matchingTermsCopy[j]].length || userRegexesCopy.length == 0) {
              hit = hitFactory.getHit(entity);
              hit[matchingTermsCopy[j]] = "<span class='marked'>" + entity[matchingTermsCopy[j]].substr(0, matchLength) + "</span>" + entity[matchingTermsCopy[j]].substr(matchLength);
              matchFound = true;

              // Remove this matching term from consideration when
              // processing other user search terms by splicing it out
              // of our copy of matching terms.
              matchingTermsCopy.splice(j, 1);
              // Since "matchingTermsCopy" is now shorter by 1, continue
              // the loop without incrementing the counter.
              continue;
            }
          }
          j++;
        }
        if (matchFound == false) {
          // If any part of the user-entered search terms failed to find
          // a match, previous matches don't matter. The entity should
          // not appear in the list of hits.
          hitFactory.killHit(entity);
          break;
        }
      }
    }
    return hitFactory.allTheHits();
  }

  function getSummaryDiv(hit) {
    var summaryDiv = $("<div class='hit'></div>");
    var picture = $("<div class='picture'><img src=\"img/" + hit.picture + "\"></div>");
    var text = $("<div class='text'></div>");
    var fullName = $("<div class='summaryElement'><span>" + hit.firstName + " " + hit.lastName + "</span></div>");
    var sex = $("<div class='summaryElement'><span>(" + hit.sex + ")</span></div>");
    var clear1 = $("<div class='clear'></div>");
    var dob = $("<div class='summaryElement'><span class='label'>DOB: </span><span>" + hit.DOB + "</span></div>");
    var age = $("<div class='summaryElement'><span class='label'>age: </span><span>" + hit.age + "</span></div>");
    var clear2 = $("<div class='clear'></div>");
    var CID = $("<div class='summaryElement'><span class='label'>CID: </span><span>" + hit.CID + "</span></div>");
    summaryDiv.append(picture);
    text.append(fullName);
    text.append(sex);
    text.append(clear1);
    text.append(dob);
    text.append(age);
    text.append(clear2);
    text.append(CID);
    summaryDiv.append(text);
    summaryDiv.data("entity-index", hit.entityIndex);
    return summaryDiv;
  }

  function switchToSearch(keepResults) {
    keepResults = keepResults == undefined ? false : keepResults;
    if (keepResults !== true) {
      $("#searchField").val("");
      $("#results").empty();
    }
    $("#addNewClient").prop("disabled", true);
    $("#search").css("display", "block");
    $("#intake").css("display", "none");
  }

  function switchToIntake(entityIndex) {
    document.getElementById("intakeForm").reset();
    $("#intakeForm .picture").empty();

    var sampleDataLength = sampleData.length;
    var entity = null;
    if (entityIndex < 0) { // New client
      entity = new Entity();
      entity.index = sampleDataLength;
      entity.picture = "unknown.png";
      entity.firstName = $("#searchForm #firstName").val();
      entity.lastName = $("#searchForm #lastName").val();
      entity.sex = "female"; // hard code this for now to prevent an error on reading
      entity.CID = "a7f8hvx3";  // this too.
      sampleData.push(entity);
    }
    else {
      for (var i=0; i<sampleDataLength; i++) {
        if (sampleData[i]["index"] == entityIndex) {
          entity = sampleData[i];
        }
      }
    }

    // Fill in the picture
    $("#intakeForm .picture").append($("<img src=\"img/" + entity.picture + "\">"));

    // Fill in the text fields
    for (prop in entity) {
      elem = $("#intakeForm #"+prop);
      if (elem !== null) {
        if (elem.is("input")) {
          elem.val(entity[prop]);
        }
      }
    }
    $("#search").css("display", "none");
    $("#intake").css("display", "block");
  }

  function saveChanges() {
    var propertyList = ["firstName", "lastName", "address", "city", "state", "zip", "DOB" ,"age"];
    var propertyListLength = propertyList.length;

    // Assign the values to the entity that are in the form.
    var index = $("#intakeForm #index").val();
    var entity = sampleData[index];
    for (var i=0; i<propertyListLength; i++) {
      entity[propertyList[i]] = $("#intakeForm #" + propertyList[i]).val();
    }       
  }
});
