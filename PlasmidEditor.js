
var PlasmidViewer = {

    is_plasmid_viewer_parent: true,
    name: 'Plasmid Viewer',
    viewers: [],

    create: function(container, p) {
        var viewer = new this.instance(this, container, p);
        this.viewers.push(viewer);
        return viewer;
    },

    err: function(msg) {
        var errmsg = 'A '+this.name+' error occurred: '+msg;
        console.log(errmsg);
    },

    instance: function(parent, container, p) {

        this.svg = null;
        this.min_dim = null; // the smallest dimension of the svg

        this.init = function(parent, container, p) {

            if(!parent || !parent.is_plasmid_viewer_parent) {
                console.log("Error: Looks like you called PlasmidViewer.instance directly. Call PlasmidViewer.create instead.");
                return null;
            }

            this.parent = parent;
            this.err = this.parent.err;
            this.container = container;
            this.p = p;

            if(!this.p) {
                this.err('No parameters given.');
                return null;
            }

            if(!this.p.data) {
                this.err('No data given. Cannot visualize plasmid with no data.');
                return null;
            }
  
            if(!$(this.container)) {
                this.err('Container element does not exist.');
                return null;
            }
            
            this.p = $.extend(p, {
                plasmid_outer_padding: 0.5, // fraction of svg size
                plasmid_inner_padding: 0.01, // fraction of sv size
                plasmid_width: 0.01, // fraction of svg size
                annotation_width: 2, // fraction of plasmid_width
                annotation_padding: 1.0, // fraction of plasmid_width
                label_min_padding: 0.05 // fraction of svg size
            });


            if(this.p.width < this.p.height) {
                this.min_dim = this.p.width;
            } else {
                this.min_dim = this.p.height;
            }

            
            this.sort_annotations();
            this.init_svg(p.width, p.height);
            this.init_arcs();
            this.draw();
        };
    
        this.sort_annotations = function() {
            if(!this.p.data.annotations) {
                return true;
            }

            // sort based on size of annotations
            // longest annotations first
            this.p.data.annotations = this.p.data.annotations.sort(function(a, b) {
                return (b.to - b.from) -(a.to - a.from);

            });
        },

        this.basepair_count_to_angle = function(count) {
            var total = this.p.data.sequence.length;
            return Math.PI * (count / total) * 2; 
        },
    
        this.start_angle = function(d) {
            var angle = this.basepair_count_to_angle(d.from);
            return angle;
        },

        this.end_angle = function(d) {
            var angle = this.basepair_count_to_angle(d.to);
            return angle;
        },
        
        this.reset_indent_tracker = function() {
            this.filled = [];
        },

        this.indent_tracker = function(from, to) {
            var i, cur, keep_searching = true;
            var level = 0;
            while(keep_searching) {
                keep_searching = false;
                for(i=0; i < this.filled.length; i++) {
//                    console.log('level: ' + level);
                    cur = this.filled[i];
                    if(cur.level != level) {
                        continue;
                    }
//                    console.log('from:'+from+' to:'+to+' cur.from:'+cur.from+' cur.to:'+cur.to);

                    if(((cur.from < from) && (cur.to > from))
                        || ((cur.from < to) && (cur.to > to))
                       || ((cur.from > from) && (cur.to < to))) {
//                        console.log("no room for "+from+":"+to+" in level "+level);
                        keep_searching = true;
                        level++;
                        break;
                    }
                }
            }

            this.filled.push({
                from: from,
                to: to,
                level: level 
            });
            return level;
        },

        this.inner_radius = function(d, no_nesting) {
            var indent = this.indent_tracker(d.from, d.to);
            var plasmid_width = (this.plasmid_outer_radius - this.plasmid_inner_radius);
            var width = this.p.annotation_width * plasmid_width;

//            console.log("Indent: " + indent);
            var indent_px = (indent * (this.p.annotation_padding * plasmid_width + width));

            var inner_no_indent = this.plasmid_inner_radius - this.p.plasmid_inner_padding * this.min_dim - width;

            if(no_nesting === true) {
                this.cur_inner_radius = inner_no_indent;
            } else {
                this.cur_inner_radius = inner_no_indent - indent_px;
            }
            
            return this.cur_inner_radius;

        },
        this.inner_radius_labels = function(d) {
            return this.inner_radius(d, true) + this.p.label_min_padding * this.min_dim;
        },

        this.outer_radius = function(d) {
            var width = this.p.annotation_width * (this.plasmid_outer_radius - this.plasmid_inner_radius);

            return this.cur_inner_radius + width;
        },
        this.outer_radius_labels = function(d) {
            return this.outer_radius(d) +  + this.p.label_min_padding * this.min_dim;
        },

        
        this.init_arcs = function() {
            this.annot_arc = d3.svg.arc()
                .startAngle($.proxy(this.start_angle, this))
                .endAngle($.proxy(this.end_angle, this))
                .innerRadius($.proxy(this.inner_radius, this))
                .outerRadius($.proxy(this.outer_radius, this))

            this.annot_label_arc = d3.svg.arc()
                .startAngle($.proxy(this.start_angle, this))
                .endAngle($.proxy(this.end_angle, this))
                .innerRadius($.proxy(this.inner_radius_labels, this))
                .outerRadius($.proxy(this.outer_radius_labels, this))

        };


        this.init_svg = function(width, height) {
            this.svg = d3.select("body")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");            
        };

        this.draw = function() {
            this.draw_plasmid();
            this.draw_annotations();
        };

        this.draw_plasmid = function() {
            var outerRadius = (this.min_dim - this.min_dim * this.p.plasmid_outer_padding) / 2;
            var innerRadius = outerRadius - this.min_dim * this.p.plasmid_width;
            this.plasmid_outer_radius = outerRadius;
            this.plasmid_inner_radius = innerRadius;

            var arc = d3.svg.arc()
                .startAngle(0)
                .endAngle(Math.PI * 2)
                .innerRadius(innerRadius)
                .outerRadius(outerRadius);

            this.svg.append('path').attr('d', arc).classed('plasmid', true);
            
            this.svg.append("svg:text")
                .attr('dy', '-0.8em')
                .attr("text-anchor", "middle")
                .classed('plasmid_name_label', true)
                .text(this.p.data.name);

            this.svg.append("svg:text")
                .attr('dy', '0.8em')
                .attr("text-anchor", "middle")
                .classed('plasmid_length_label', true)
                .text('('+this.p.data.sequence.length+' bp)');

        };

        this.draw_annotations = function() {
            this.reset_indent_tracker();
            

            this.annot_nodes = this.svg.selectAll("g[class~='annotation']")
                .data(this.p.data.annotations)
                .enter()
                .append('g');

            this.draw_labels(this.annot_nodes[0]);

            this.pack_labels();


            this.annot_nodes
                .append('path')
                .attr('d', this.annot_arc)
                .style("stroke", "#fff")
                .classed('annotation', true)
                .on('mouseenter', this.annot_mouseenter)
                .on('mouseleave', this.annot_mouseleave);

                 // TODO above handlers should be on th g node
        };


        // Scope is wrong for this
        this.annot_mouseenter = function() {
            d3.select(this).classed('annotation_hover', true);
        };

        this.annot_mouseleave = function() {
            d3.select(this).classed('annotation_hover', false);
        };

        this.labels = [];

        this.draw_labels = function(nodes) {
            var i, node, d3node, d, line_start, line_end, label_pos, label, label_line;
            this.labels = [];

            for(i=0; i < nodes.length; i++) {
                node = nodes[i];
                d = nodes[i].__data__;
                line_start = this.annot_arc.centroid(d);
                line_end = this.annot_label_arc.centroid(d);
                console.log(line_start + ' - ' + line_end);
                d3node = d3.select(node);

                label_line = d3node.append('svg:line')
                    .attr("x1", line_start[0])
                    .attr("y1", line_start[1])
                    .attr("x2", line_end[0])
                    .attr("y2", line_end[1])
                    .style("stroke", "#AAA");

                label_pos = line_end;                

                label = d3node.append('svg:text')
                    .attr("transform", 'translate('+label_pos+')')
                    .attr('text-anchor', 'left')
                    .classed('annotation_name_label', true)
                    .text(d.name);

                if(line_end[1] > 0) {
                    label_pos[1] += label.node().getBBox().height * 0.8;
                    label.attr('transform', 'translate('+label_pos+')');
                }

                if(line_end[0] < 0) {
                    label_pos[0] -= label.node().getBBox().width;
                    label.attr('transform', 'translate('+label_pos+')');
                }


                label.line = label_line;
                label.coords = line_end;
                this.labels.push(label);
            }

        };

        this.pack_labels = function() {
            this.labels.sort(function(l1, l2) {
                // sort by y coord, 
                return l1.coords[1] < l2.coords[1];

            });

            console.log('first: ' + this.labels[0].text());

            var i, cur, node, bb, width, height, x, y;
            for(i=0; i < this.labels.length; i++) {
                cur = this.labels[i];
//                console.log(width+' '+height+' '+x+' '+y);
                
                this.pack_label(cur);

            }
        };

//        this.stop = false;

        this.pack_label = function(label) {
            if(this.c > 10) {
                console.log('stopping!');
                return;
            }
            var i, cur, o1, label_bb, cur_bb, o2;
            var found_overlap = true;
            while(found_overlap) {

                label_bb = label.node().getBBox();
               
                o1 = {
                    x1: label.coords[0],
                    y1: label.coords[1],
                    x2: label.coords[0] + label_bb.width,
                    y2: label.coords[1] + label_bb.height * 0.9 // TODO move hardcoded factor
                };                
                
                found_overlap = false;
                for(i=0; i < this.labels.length; i++) { 
                    o2 = {};
                    cur = this.labels[i];
                    if(cur == label) {
                        continue;
                    }
                    cur_bb = cur.node().getBBox();
                    
                    o2.x1 = cur.coords[0];
                    o2.y1 = cur.coords[1];
                    o2.x2 = o2.x1 + cur_bb.width;
                    o2.y2 = o2.y1 + cur_bb.height * 0.9;
                    
                    var overlap = this.check_overlap(o1, o2);
                    if(overlap) {
                        console.log("overlap for: " + label.text() + ' with ' + cur.text() + ' of ' + overlap);
                        found_overlap = true;
                        this.extend_line(label, o1, overlap);
                        this.c += 1;
                        if(this.c > 10) {
                            return;
                        }
                        break;
                        
                    }  
                };
//                found_overlap = true; // DEBUG
            }
        };
        
        this.c = 0;

        this.extend_line = function(label, o, overlap) {

            // y = a*x + b
            var a = o.y1 / o.x1;
//            var new_y = o.y1 - label.node().getBBox().height * 1.1;
            var new_y = o.y1 - overlap * 1.1;
            console.log('moved ' + label.text() + ' from ' + o.y1 + ' to ' + new_y);
            var new_x = new_y / a;
            var coords = [new_x, new_y];
            label.attr('transform', 'translate('+coords+')')
            label.line.attr('x2', new_x)
            label.line.attr('y2', new_y)
            label.coords = coords;
//            console.log('----: ' + coords[0] + ',' + coords[1]);
//            for(key in label) {
//                console.log(key + ': ' + label);
//            }
//            alert('');
        };

        this.check_overlap = function(o1, o2) {

            if((o1.x1 <= o2.x2) && (o1.x2 >= o2.x1) 
               || ((o1.x2 >= o2.x1) && (o1.x1 <= o2.x2))) {

                if((o1.y1 <= o2.y2) && (o1.y2 >= o2.y1)) {
                    return o1.y2 - o2.y1;
                }
                if((o1.y2 >= o2.y1) && (o1.y1 <= o2.y2)) { 
//                    console.log(o1.x1+','+o1.y1+' '+o1.x2+','+o1.y1+' | ' +o2.x1+','+o2.y1+' '+o2.x2+','+o2.y1);
//                    return o2.y1 - o1.y2;
                    return false;
                }
            }
            return false;
        };

/*
        this.centroid_annot_arc_x1 = function(d) {
            return this.annot_arc.centroid(d)[0];
        };

        this.centroid_annot_arc_y1 = function(d) {
            return this.annot_arc.centroid(d)[1];
        };
*/

/*
        this.get_centroid = function(d) {
            var str = "translate(" + this.annot_arc.centroid(d) + ")";
            console.log(str);
            return str;
        };
*/

        this.init(parent, container, p);

    }
}


