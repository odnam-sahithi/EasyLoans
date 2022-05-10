const express = require('express');
const passport = require('passport');
const router = express.Router();
const loanController = require('../controllers/loan');
const { catchAsyncError, isLoggedIn, isOwner, isPendingLoan, isNotOwner, checkEligibility } = require('../middleware');

// 
router.route('/apply')
    .get(isLoggedIn, loanController.applicationForm)
    .post(isLoggedIn, checkEligibility, loanController.LoanDB)

// update form
router.get('/:id/edit', isLoggedIn, isOwner, isPendingLoan, catchAsyncError(loanController.editLoan));

// update in db
router.put('/:id/edit', isLoggedIn, isOwner, isPendingLoan, checkEligibility, catchAsyncError(loanController.updateLoan));

// delete
router.delete('/:id/delete', isLoggedIn, isOwner, isPendingLoan, catchAsyncError(loanController.deleteLoan));


router.get('/:id/show', isLoggedIn, isPendingLoan, catchAsyncError(loanController.show));

router.post('/:id/counter', isLoggedIn, isPendingLoan, isNotOwner, checkEligibility, catchAsyncError(loanController.loanCounter));

router.get('/:id/counter/:c_id/accept', isLoggedIn, isOwner, isPendingLoan, catchAsyncError(loanController.acceptCounter));

router.get('/:id/counter/:c_id/reject', isLoggedIn, isOwner, isPendingLoan, catchAsyncError(loanController.rejectCounter))

router.post('/:id/accept', isLoggedIn, isNotOwner, isPendingLoan, checkEligibility, catchAsyncError(loanController.acceptDirectly));

module.exports = router;