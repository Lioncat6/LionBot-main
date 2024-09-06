const { trustedIds } = require("../config.json");

function handlePermissions(){

}

function checkOverride(id){
    for (memberId in trustedIds){
        if (memberId.toString() == id.toString()){
            console.log("Trusted ID bypassed permission requirements!")
            return true
        } else {
            console.log(memberId + " "+ id)
        }
    }
    return false;
}

module.exports = {
    handlePermissions,
    checkOverride
};
