const Loan = require('./models/loan');
const GoogleUser = require('./models/googleuser');
const isLoggedIn = (req, res, next) => {
    if (req.user) next();
    else { // not logged in
        // console.log("Login first");
        req.flash('primary', 'You need to be logged in!!');
        res.redirect('/auth/login');
    }
}
module.exports.isLoggedIn = isLoggedIn;


module.exports.isOwner = async (req, res, next) => {
    const { id } = req.params;
    const loan = await Loan.findById(id);
    if (loan !== null && loan.owner.equals(req.user._id)) {
        next();
    } else {
        req.flash('error', 'Action Prohibited as it belongs to someone else!');
        // console.log("NOT ALLOWEDD");
        return res.redirect('/home');
    }
}

module.exports.isNotOwner = async (req, res, next) => {
    const { id } = req.params;
    const loan = await Loan.findById(id);
    if (loan === null || loan.owner.equals(req.user._id)) {
        req.flash('error', 'Action Prohibited as it belongs to someone else!');
        // console.log("NOT ALLOWEDD");
        return res.redirect('/home');
    } else {
        next();
    }
}


module.exports.catchAsyncError = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(e => next(e));
    }
}



module.exports.isPendingLoan = async (req, res, next) => {
    const { id } = req.params;
    const loan = await Loan.findById(id);
    if (loan !== null && loan.isPending === true) {
        next();
    }
    else {
        req.flash('error', 'As the deal is already closed, action is prohibited.');
        // console.log("NOT ALLOWEDD");
        return res.redirect('/home');
    }
}


module.exports.checkEligibility = async (req, res, next) => {
    const user = await GoogleUser.findById(req.user.id);
    if (user.aadharNumber !== '' && user.panNumber !== '' && user.aadharPic.length !== 0 && user.panPic.length !== 0 && user.userPic.length !== 0
        && user.ifscCode !== '' && user.accountNumber !== '' && user.ctc !== 0) {
        // now we have all documents 
        const loan = await Loan.findById(req.params.id);
        const { amount } = req.body;
        if (loan != null && loan.amount <= user.max_amount) {
            next();
        }
        else if (loan == null && amount) {
            if (amount <= user.max_amount) {
                next();
            }
            else {
                req.flash('error', 'As the amount is more than allowed, action is prohibited.');
                console.log('not');
                return res.redirect('/home');
            }
        }
        else {
            req.flash('error', 'As the amount is more than allowed, action is prohibited.');
            console.log('not');
            return res.redirect('/home');
        }
    }else{
        req.flash('error', 'Complete the profile!!');
        return res.redirect('/profile/update');
    }
}