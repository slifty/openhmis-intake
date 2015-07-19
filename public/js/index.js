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
      if (str.length > 1) {
        var newHits = search(str);
        var newHitsLength = newHits.length;
        alert(newHitsLength);
        // Create an array to hold indices of all the latest hits.
        // var newHitIndices = []; get rid of this??? Probably can't right?
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

  var matchingTerms = ["firstName", "lastName", "pathwaysId"];
  var matchingTermsLength = matchingTerms.length;

  function Hit(entity, matchingField, matchLength) {
    this.entity = entity;
    this.photo = $("<img src='img/" + this.entity.picture + "'>");
    this.name = $("<div class='summaryElement'>");
    this.sex = $("<div class='summaryElement'>(" + this.entity.sex + ")</div>");
    this.dob = $("<div class='summaryElement'>" + this.entity.DOB + "</div>");
    this.pathwaysId = $("<div class='summaryElement'>");
    this.matchingStrings = {};
  }

  Hit.prototype.formatMatchingStrings = function() {
    this.matchingStrings = {};
    // Add formatting <span>s based on matchingField and matchLength.
    for (var i=0; i < matchingTermsLength; i++) {
      if (matchingTerms[i] == matchingField) {
        this.matchingStrings[matchingTerms[i]] = "<span class='matched'>" + this.entity[matchingTerms[i]].substr(0, matchLength) + "</span>" + this.entity[matchingTerms[i]].substr(matchLength);
      }
      else {
        this.matchingStrings[matchingTerms[i]] = this.entity[matchingTerms[i]];
      }
    }
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
    this.refreshMatchingStrings();
    summaryDiv.append(this.photo);
    summaryDiv.append(this.name);
    summaryDiv.append(this.sex);
    summaryDiv.append(this.dob);
    summaryDiv.append(this.pathwaysID);
    return summaryDiv;
  }

  function search(str) {
    var hits = [];
    var strLength = str.length;
    var sampleDataLength = sampleData.length;
    for (var i=0; i<sampleDataLength; i++) {
      for (var j=0; j<matchingTermsLength; j++) {
        if (sampleData[i][matchingTerms[j]].substr(0, strLength).toLowerCase() == str.toLowerCase()) {
          hits.push(new Hit(sampleData[i], matchingTerms[j], strLength));
        }
      }
    }
    return hits;
  }
})
