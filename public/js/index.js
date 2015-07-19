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
  });

  var matchingTerms = ["pathwaysId"];
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
      var oldHitIndex = $(this).attr("data-entity-index");
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
  }

  function Hit(entity) {
    this.entityIndex = entity["index"];
    this.removeMe = false; // Used when comparing to already-matched records.
    // The constructor already starts preparing the new object's members
    // for their eventual lives as elements in the DOM. I'm not crazy
    // about doing this at this stage, but wrapping them in <span>s now
    // makes it easy to override member values with strings that match
    // user input and that have been prewrapped in <span>s to show these
    // matches.
    this.picture = "<img src=\"img/" + entity["picture"] + "\">";
    this.sex = "<span>(" + entity.sex.substr(0,1).toUpperCase() + ")</span>";
    this.DOB = "<span>" + entity.DOB + "</span>";
    this.pathwaysId = "<span>" + entity.pathwaysId + "</span>";
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

      // Try to find a match on the entity's full name including
      // middle initial. This will also find matches if the user
      // has entered only a first name or a partial first name.
      var entityFullName = entity.firstName + " ";
      if (entity.middleInitial.length > 0) {
        entityFullName += entity.middleInitial + " ";
      }
      entityFullName += entity.lastName;

      var entityDisplayName =  entity.firstName + " ";
      if (entity.middleInitial.length > 0) {
        entityDisplayName += entity.middleInitial + ". ";
      }
      entityDisplayName += entity.lastName;

      var res = entityFullName.match(userRe);
      if (res !== null) {
        // We found a match on at least the start of the first name.
        // Kludgily insert that stupid dot back into our results if
        // appropriate.
        if (res.length > 3) { res[2] += "."; }
        var matchedLength = res.slice(1).join(" ").length;
        var formattedName = "<span><span class='marked'>" + entityDisplayName.substr(0, matchedLength) + "</span>" + entityDisplayName.substr(matchedLength) + "</span>";
        var newHit = new Hit(entity);
        newHit["name"] = formattedName;
        hits.push(newHit);
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
          var newHit = new Hit(entity);
          newHit["name"] = formattedName;
          hits.push(newHit);
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
            var newHit = new Hit(entity);
            newHit["name"] = formattedName;
            hits.push(newHit);
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
          var newHit = new Hit(entity);
          newHit["name"] = "<span>" + entityFullName + "</span>";
          newHit[matchingTerms[j]] = formattedString;
          hits.push(newHit);
        }
      }
    }
    return hits;
  }

  function getSummaryDiv(hit) {
    var summaryDiv = $("<div class='hit' data-entity-index='" + hit.entityIndex + "'></div>");
    var picture = $("<div class='picture'>" + hit.picture + "</div>");
    var text = $("<div class='text'></div>");
    // I should be looping through these instead of doing all explicity. DEAL WITH THIS LATER.
    var name = $("<div class='summaryElement'>" + hit.name + "</div>");
    var sex = $("<div class='summaryElement clear'>" + hit.sex + "</div>");
    var dob = $("<div class='summaryElement'>" + hit.DOB + "</div>");
    var pathwaysId = $("<div class='summaryElement'>" + hit.pathwaysId + "</div>");
    summaryDiv.append(picture);
    text.append(name);
    text.append(sex);
    text.append(dob);
    text.append(pathwaysId);
    summaryDiv.append(text);
    return summaryDiv;
  }
})
