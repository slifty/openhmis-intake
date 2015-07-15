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
})
