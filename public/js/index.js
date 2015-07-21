$(function() {
  $(document).ready(function() {
    var minSearchLength = 1;
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

  var matchingTerms = ["CID"];
  var matchingTermsLength = matchingTerms.length;

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
    this.entityIndex = entity["index"];
    this.removeMe = false; // Used when comparing to already-matched records.
    this.picture = entity["picture"];
    this.fullName = getEntityName(entity);
    this.sex = entity.sex.substr(0,1).toUpperCase();
    this.DOB = entity.DOB;
    this.age = entity.age;
    this.CID = entity.CID;
  }

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

  HitFactory.prototype.allTheHits = function() {
    var hitList = [];
    for (entityIndex in this.hits) {
      hitList.push(this.hits[entityIndex]);
    }
    return hitList;
  }

  function search(userString) {
    // Trim trailing dots and whitespace from the user's input.
    userString = userString.replace(/^[ .]+/, "").replace (/[ .]+$/, "");
    // Use a regex to split the string on whitespace, removing a
    // middle initial dot (if present) in the process, and rejoin with
    // a single space.
    userString = userString.split(/[.]?\s+/).join(" ");
    // Create a case-insensitive regex based on the user's entry.
    var userRe = new RegExp("^(" + userString.replace(/\s/g, ") (") + ")", "i");

    // Use this empty object to store our results. The key is the entity
    // ID. The value is the Hit instance.
    var hitFactory = new HitFactory();

    var sampleDataLength = sampleData.length;
    for (var i=0; i<sampleDataLength; i++) {
      var entity = sampleData[i];

      // Try to find a match on the entity's full name including
      // middle initial. This will also find matches if the user
      // has entered only a first name or a partial first name.
      var entityFullName = getEntityName(entity, true, false); // with MI, without dot
      var entityDisplayName =  getEntityName(entity, true, true); // with MI, with dot

      var res = entityFullName.match(userRe);
      if (res !== null) {
        // We found a match on at least the start of the first name.
        // Kludgily insert that stupid dot back into our results if
        // appropriate.
        if (res.length > 3) { res[2] += "."; }
        var matchedLength = res.slice(1).join(" ").length;
        var formattedName = "<span class='marked'>" + entityDisplayName.substr(0, matchedLength) + "</span>" + entityDisplayName.substr(matchedLength);
        var hit = hitFactory.getHit(entity);
        hit["fullName"] = formattedName;
      }
      else {
        // The user might have entered first and last names without a
        // middle initial. Try to find a match.
        entityFirstAndLast = getEntityName(entity, false); // without MI
        res = entityFirstAndLast.match(userRe);
        if (res !== null) {
          // We found a match on the full name without a middle initial.
          // We know we've matched the full first name. Find out how much
          // of the last name was matched too.
          var matchedLastNameLength = res[2].length;
          var formattedName = "<span class='marked'>" + entity.firstName + "</span> ";
          if (entity.middleInitial && entity.middleInitial.length > 0) {
            formattedName += entity.middleInitial + ". ";
          }
          formattedName += "<span class='marked'>" + entity.lastName.substr(0,matchedLastNameLength) + "</span>" + entity.lastName.substr(matchedLastNameLength);
          var hit = hitFactory.getHit(entity);
          hit["fullName"] = formattedName;
        }
        else {
          // The user might have entered just a last name.
          res = entity.lastName.match(userRe);
          if (res !== null) {
            // We found a match on just the last name.
            var matchedLastNameLength = res[1].length;
            var formattedName = entity.firstName;
            if (entity.middleInitial && entity.middleInitial.length > 0) {
              formattedName += " " + entity.middleInitial + ". ";
            }
            formattedName += "<span class='marked'>" + entity.lastName.substr(0,matchedLastNameLength) + "</span>" + entity.lastName.substr(matchedLastNameLength);
            var hit = hitFactory.getHit(entity);
            hit["fullName"] = formattedName;
          }
        }
      }
      // Now that we've checked for matching names, check for our other
      // matching criteria.
      var userStringLength = userString.length;
      for (var j=0; j<matchingTermsLength; j++) {
        var dataSubstring = sampleData[i][matchingTerms[j]].substr(0, userStringLength);
        if (dataSubstring.toLowerCase() == userString.toLowerCase()) {
          var formattedString = "<span class='marked'>" + dataSubstring + "</span>" + sampleData[i][matchingTerms[j]].substr(userStringLength);
          var hit = hitFactory.getHit(entity);
          hit[matchingTerms[j]] = formattedString;
        }
      }
    }
    return hitFactory.allTheHits();
  }

  function getEntityName(entity, useMI, useDot) {
    useMI = useMI == undefined ? true : useMI;
    useDot = useMI == true ? (useDot == undefined ? true : useDot) : false;
    var entityName = entity.firstName + " ";
    if (entity.middleInitial && entity.middleInitial.length > 0) {
      if (useMI == true) {
        entityName += entity.middleInitial + (useDot ? "." : "") + " ";
      }
    }
    entityName += entity.lastName;
    return entityName;
  }

  function getSummaryDiv(hit) {
    var summaryDiv = $("<div class='hit'></div>");
    var picture = $("<div class='picture'><img src=\"img/" + hit.picture + "\"></div>");
    var text = $("<div class='text'></div>");
    var fullName = $("<div class='summaryElement'><span>" + hit.fullName + "</span></div>");
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
      entity.fullName = $("#searchForm #searchField").val();
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
    if (entity !== null) {
      // Fill in the picture
      $("#intakeForm .picture").append($("<img src=\"img/" + entity.picture + "\">"));
      // Fill in the name field
      if (entity.hasOwnProperty("fullName")) { // i.e., because we just assigned it above...
        $("#intakeForm #fullName").val(entity.fullName);
      }
      else {
        $("#intakeForm #fullName").val(getEntityName(entity));
      }
      // Fill in the CID field
      $("#intakeForm #readOnlyCID").val("CID:   " + entity.CID);
      // Fill in other fields
      for (prop in entity) {
        elem = $("#intakeForm #"+prop);
        if (elem !== null) {
          if (elem.is("input")) {
            elem.val(entity[prop]);
          }
        }
      }
    }
    $("#search").css("display", "none");
    $("#intake").css("display", "block");
  }

  function saveChanges() {
    var propertyList = ["address", "city", "state", "zip", "DOB" ,"age"];
    var propertyListLength = propertyList.length;

    // Parse out name components.
    var fullName = $("#intakeForm #fullName").val().trim();
    var firstName = "";
    var middleInitial = "";
    var lastName = "";
    var nameList = fullName.split(" ");
    if (nameList.length == 2) {
      firstName = nameList[0].trim();
      lastName = nameList[1].trim();
    }
    else if (nameList.length == 3) {
      firstName = nameList[0].trim();
      middleInitial = nameList[1].substr(0,1);
      lastName = nameList[2].trim();
    }

    // Assign the values to the entity that are in the form.
    var index = $("#intakeForm #index").val();
    var entity = sampleData[index];
    // Start with the name, since that one is special.
    entity.firstName = firstName;
    entity.middleInitial = middleInitial;
    entity.lastName = lastName;
    // Now do the other simpler properties.
    for (var i=0; i<propertyListLength; i++) {
      entity[propertyList[i]] = $("#intakeForm #" + propertyList[i]).val();
    }       
  }
});
