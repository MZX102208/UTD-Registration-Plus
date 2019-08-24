/*
 * classUID - Unique identifier for this course
 * scheduleBlocks - The days, times, and locations this class is held
 * extras - Object to hold other information such as course name, section number, etc.
 */
function Course(classUID, scheduleBlocks, extras) {
    this.classUID = classUID;
    this.scheduleBlocks = scheduleBlocks;
    this.extras = extras;
}
