$(function() {
	$("#intakeForm").submit(function() {
		var data = $(this).serialize();
    $.ajax("client", {
      method: "POST",
      data: data,
    })
    .done(function(d) {
      console.log(d);
    });
    return false;
	});

  $(document).ready(function() {
    $("#searchField").keyup(function() {
      var str = $("#searchField").val();
      if (str.length > 0) {
        var newHits = search(str);
        var newHitsLength = newHits.length;
        alert(newHitsLength);
        var oldHits = "#results .hit";
        var keepers = [];
        // Create an array to hold indices of all the latest hits.
        var newHitIndices = []; // get rid of this??? Probably can't right?
        for (var i=0; i<newHitsLength; i++) {
          newHitIndices.push(newHits[i].entity.index);
        }
        // Mark any hits from the results window that are no longer hits for removal from the "results" div.
        $("#results .hit").not(function () {
           $.inArray((this).get().entity.index, newHits)
        }).addClass("removeme");
        // And mark any hits in "newHits" that are already in the "results" div for removal from "newHits" because we don't need to add them again.
        $(newHits).function(function () {
           $.inArray((this).get().entity.index, oldHits)
        }).addClass("removeme");
        // Now remove from the "results" div...
        $("#results .hit.removeme").remove();
        // And from "newHits"
        $(newHits .removeme).remove();
        // Any hits that remain in the results div are still matches, so refresh their matching strings
        $("#results .hit").get().refreshMatchingStrings();
        // And finally add whatever is left in "newHits"
        // AND THEN I DID THAT.
      }
    });
  });

  var matchingTerms = ["pathwaysId"];
  var matchingTermsLength = matchingTerms.length;

  function Hit(entity, matchingField, formattedString) {
    this.entity = entity;
    this.matchingField = matchingField;
    this.formattedString = formattedString
  }

  Hit.prototype.refreshMatchingStrings = function() {
    var nameDiv = $(this.name);
    var pathwaysIdDiv = $(this.pathwaysId);
    nameDiv.empty();
    nameDiv.append($(this.matchingStrings["lastName"] + ", " + this.matchingStrings["firstName"] + ", " + this.entity.middleInitial ));
    pathwaysId.empty();
    pathwaysId.append($(this.matchingStrings["pathwaysId"]));
  }

  Hit.prototype.getSummaryDiv = function() {
    var summaryDiv = $("<div class='hit'>");
    var photoDiv = $("<img src='img/" + this.entity.picture + "'>");
    var sex = $("<div class='summaryElement'>(" + this.entity.sex + ")</div>");
    var dob = $("<div class='summaryElement'>" + this.entity.DOB + "</div>");
    // loop through the matchable fields to format as bold where appropriate
    
    //    this.pathwaysId = $("<div class='summaryElement'>");
    
    this.refreshMatchingStrings();
    summaryDiv.append(this.photo);
    summaryDiv.append(this.name);
    summaryDiv.append(this.sex);
    summaryDiv.append(this.dob);
    summaryDiv.append(this.pathwaysID);
    return summaryDiv;
  }

  function search(userString) {
    var hits = [];
    // Trim trailing dots and whitespace from the user's input.
    userString = userString.replace(/^[ .]+/, "").replace (/[ .]+$/, "");
    // Use a regex to split the string on whitespace, removing a
    // middle initial dot (if present) in the process, and rejoin with
    // a single space.
    userString = userString.split(/[.]?\s+/).join(" ");
    // Create a case-insensitive regex based on the user's entry.
    var userRe = new RegExp("^(" + userString.replace(/\s/g, ") (") + ")", "i");

    var sampleDataLength = sampleData.length;
    for (var i=0; i<sampleDataLength; i++) {
      var entity = sampleData[i];

      // First check for name matches, starting with the most complex:
      // "fname mi. lname" I was trying to do this with regexes but I
      // don't think you can. Also I would rather save formatting for
      // the "getSummaryDiv" but we're doing the matching now so as
      // long as we're doing this grinding we might as well use it.
      var entityFullName = "";

      // Try to find a match on the entity's full name including
      // middle initial. This will also find matches if the user
      // has entered only a first name or a partial first name.
      if (entity.middleInitial.length > 0) {
        entityFullName += entity.firstName + " " + entity.middleInitial + " " + entity.lastName;
        entityFullNameForDisplay = entity.firstName + " " + entity.middleInitial + ". " + entity.lastName;
      }
      else {
        entityFullName += entity.firstName + " " + entity.lastName;
        entityFullNameForDisplay = entityFullName;
      }

      var res = entityFullName.match(userRe);
      if (res !== null) {
        // We found a match on the full name with initial.
        // Kludgily insert that stupid dot back into our results if appropriate.
        if (res.length > 3) { res[2] += "."; }
        var matchedLength = res.slice(1).join(" ").length;
        var formattedName = "<span><span class='marked'>" + entityFullNameForDisplay.substr(0, matchedLength) + "</span>" + entityFullNameForDisplay.substr(matchedLength) + "</span>";
        hits.push(new Hit(entity, "name", formattedName));
      }
      else {
        // The user might have entered first and last names without a
        // middle initial. Try to find a match.
        entityFullName = entity.firstName + " " + entity.lastName;
        res = entityFullName.match(userRe);
        if (res !== null) {
          // We found a match on the full name without a middle initial.
          // We know we've matched the full first name. Find out how much
          // of the last name was matched too.
          var matchedLastNameLength = res[2].length;
          var formattedName = "<span><span class='marked'>" + entity.firstName + "</span> ";
          if (entity.middleInitial.length > 0) {
            formattedName += entity.middleInitial + ". ";
          }
          formattedName += "<span class='marked'>" + entity.lastName.substr(0,matchedLastNameLength) + "</span>" + entity.lastName.substr(matchedLastNameLength) + "</span>";
          hits.push(new Hit(entity, "name", formattedName));
        }
        else {
          // The user might have entered just a last name.
          res = entity.lastName.match(userRe);
          if (res !== null) {
            // We found a match on just the last name.
            var matchedLastNameLength = res[1].length;
            var formattedName = "<span>" + entity.firstName;
            if (entity.middleInitial.length > 0) {
              formattedName += " " + entity.middleInitial + ". ";
            }
            formattedName += "</span><span class='marked'>" + entity.lastName.substr(0,matchedLastNameLength) + "</span>" + entity.lastName.substr(matchedLastNameLength) + "</span>";
            hits.push(new Hit(entity, "name", formattedName));
          }
        }
      }
      // Now that we've checked for matching names, check for our other
      // matching criteria.
      var userStringLength = userString.length;
      for (var j=0; j<matchingTermsLength; j++) {
        var dataSubstring = sampleData[i][matchingTerms[j]].substr(0, userStringLength);
        if (dataSubstring.toLowerCase() == userString.toLowerCase()) {
          var formattedString = "<span><span class='marked'>" + dataSubstring + "</span>" + sampleData[i][matchingTerms[j]].substr(userStringLength) + "</span>";
          hits.push(new Hit(entity, matchingTerms[j], formattedString));
        }
      }
    }
    return hits;
  }
})
