


var test_plasmid = {
    name: "pFAB273",
    annotations: [
        {
            name: "Smallish",
            type: "Restriction site",
            description: "Very small",
            from: 10,
            to: 20
        },
        {
            name: "ACH!",
            type: "Restriction site",
            description: "Very small",
            from: 12,
            to: 22
        },
        {
            name: "Small",
            type: "Restriction site",
            description: "Very small",
            from: 30,
            to: 40
        },
        {
            name: "GFP",
            type: "Gene",
            description: "Green Fluorescent Protein",
            from: 50,
            to: 100
        },
        {
            name: "Overlapper",
            type: "Lap",
            description: "Overlapper",
            from: 5,
            to: 45
        },

// ----------------

        {
            name: "Foo",
            type: "Restriction site",
            description: "Very small",
            from: 120,
            to: 140
        },
        {
            name: "Bar",
            type: "Restriction site",
            description: "Very small",
            from: 110,
            to: 150
        },
        {
            name: "Baz",
            type: "Restriction site",
            description: "Very small",
            from: 160,
            to: 200
        },
        {
            name: "Kasaz",
            type: "Gene",
            description: "Green Fluorescent Protein",
            from: 190,
            to: 240
        },
        {
            name: "Worchestershire",
            type: "Lap",
            description: "Overlapper",
            from: 241,
            to: 260
        }

    ],

    sequence: "AAATTAGGATCTCTCGCATCATCGCGTCTTCGCGTACAGTTGTTCGTAGCTATATATATACGCTGATCATCTAATTAATAAATGCGGCGCTTTTCTCTGCGACGTACGTAGCGGCGGCTTTTATTAGCTAGCTAGGAGAGCGCGCGGCGCGGCTATATATAAAAAACACACACACCCCCCCACACACCACATATTTGCGGGCACTCGATCGTAGCATGGGGGCGGCTAGCTAGCTAGTCATTATTATCGCGCCGGGGGGTCAGTCGATGTAGTAGCGCGCTGCATGCTGAGAAGGAGCTCCTAGCGTAGGAGGAGCGAGAGCGGCAGGAGCGCGATATCGTCGCTGCTGCTAGGAGGAGAGCGGCGGATAGCTGACGAAAAAA"

};


function page_init() {

    // d3.select('#container').append('p').text('foo');
    PlasmidViewer.create('#container', {
        width: 400,
        height: 400,
        data: test_plasmid
    });
  
}



$(document).ready(function() {
    page_init();
});
