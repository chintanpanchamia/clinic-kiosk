(function() {
  listenForPatientUpdate();
  listenForEmailUpdate();
})();

var placeholder = "";

function myBlur(e) {
    e.placeholder = placeholder;
}

function myFocus(e) {
    placeholder = e.placeholder;
    e.placeholder = "";
}



function listenForPatientUpdate() {

  $('#patient-list').on('change', '.send-checkbox', markUserForUpdate);
  $('#save-changes-button').click(getMarkedPatients);

  //Toggle email for all patients
  $('#email-all-button').click(function(){
    saveChanges($('.patient'), true);
  });
  $('#email-none-button').click(function(){
    saveChanges($('.patient'), false);
  });
}


function markUserForUpdate(e) {
  var checkbox = e.currentTarget;
  var patientElement = checkbox.parentNode.parentNode;
  if (patientElement.classList.contains('changed')) {
    patientElement.classList.remove('changed');
  } else {
    patientElement.classList.add('changed');
  }
  activateSaveButton();
}

function activateSaveButton() {
  var $saveButton = $('#save-changes-button');
  if ($saveButton.attr('disabled')) {
    $saveButton.removeAttr('disabled');
    $saveButton.addClass('enabled-button');
  }
}

function getMarkedPatients(e) {
  e.currentTarget.disabled = true;
  var $changedPatients = $('#patient-list').find('.changed');
  saveChanges($changedPatients);
}

function saveChanges($patientsList, boolean) {
  $('#save-guard').removeClass('display-none');
  var putRequests = [];
  var isCheck = boolean;
  for (var i = 0; i < $patientsList.length; i++) {
    var checkbox = $patientsList[i].querySelector('.send-checkbox');
    if (boolean === undefined) {
      isCheck = isChecked(checkbox);
    } else {
      updatePatientCheckbox(checkbox, isCheck);
    }

    putRequests.push(buildPutRequest($patientsList[i], isCheck));
    $patientsList[i].classList.remove('changed');
  }
  sendRequests(putRequests);
}


function sendRequests(requests) {
  $.when.apply($, requests).then(
    //Success
    function() {
      $('#save-guard').addClass('display-none');
      successSave();
    },
    //Error
    function() {
      $('#save-guard').addClass('display-none');
      errorSave();
    });
}


function isChecked(checkbox) {
  if (checkbox.checked) {
    return true;
  }

  return false;
}


function updatePatientCheckbox(checkbox, isCheck) {
  if (isCheck) {
    checkbox.checked = true;
  } else {
    checkbox.checked = false;
  }
}

function buildPutRequest(patient, bool) {
  var csrftoken = getCookie('csrftoken');
  return $.ajax({
    url: 'api/patient/' + patient.dataset.patient + '/',
    type: 'PATCH',
    data: {'send_email': bool},
    beforeSend: function(xhr) {
      xhr.setRequestHeader("X-CSRFToken", csrftoken);
    }
  });
}


function listenForEmailUpdate() {
  $('#save-email-button').click(saveEmail);
}

function saveEmail(e) {
  e.preventDefault();
  var saveButton = e.currentTarget;
  saveButton.disabled = true;
  var $form = $(saveButton.parentElement);

  var csrftoken = getCookie('csrftoken');
  $.ajax({
    url: '/api/doctor/' + $form.data('user-id') +'/',
    type: 'PATCH',
    data: $form.serialize(),
    beforeSend: function(xhr) {
      xhr.setRequestHeader("X-CSRFToken", csrftoken);
    },
    success: function() {
      saveButton.disabled = false;
      successSave();
    },
    error: function() {
      saveButton.disabled = false;
      errorSave();
    }
  });
}

// Displays message after save
function successSave() {
  var saveSuccess = $('#save-success');
  showSaveResult(saveSuccess);
}

function errorSave() {
  var saveFail = $('#save-fail');
  showSaveResult(saveFail);
}

function showSaveResult(saveStatus) {
  saveStatus.addClass('save-result-fade');
  setTimeout(function() {
    saveStatus.removeClass('save-result-fade');
  }, 1000);
}


// From Django docs https://docs.djangoproject.com/en/1.9/ref/csrf/
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = $.trim(cookies[i]);
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(
                                cookie.substring(name.length + 1)
                              );
                break;
            }
        }
    }
    return cookieValue;
}

