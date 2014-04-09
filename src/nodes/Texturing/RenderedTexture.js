/** @namespace x3dom.nodeTypes */
/*
 * X3DOM JavaScript Library
 * http://www.x3dom.org
 *
 * (C)2009 Fraunhofer IGD, Darmstadt, Germany
 * Dual licensed under the MIT and GPL
 */

/* ### RenderedTexture ### */
x3dom.registerNodeType(
    "RenderedTexture",
    "Texturing",
    defineClass(x3dom.nodeTypes.X3DTextureNode,
        
        /**
         * Constructor for RenderedTexture
         * @constructs x3dom.nodeTypes.RenderedTexture
         * @x3d x.x
         * @component Texturing
         * @status experimental
         * @extends x3dom.nodeTypes.X3DTextureNode
         * @param {Object} [ctx=null] - context object, containing initial settings like namespace
         */
        function (ctx) {
            x3dom.nodeTypes.RenderedTexture.superClass.call(this, ctx);

            if (ctx)
                ctx.doc._nodeBag.renderTextures.push(this);
            else
                x3dom.debug.logWarning("RenderedTexture: No runtime context found!");

            // Original proposal taken from:  http://www.xj3d.org/extensions/render_texture.html
            // http://doc.instantreality.org/documentation/nodetype/RenderedTexture/?filter=None


            /**
             *
             * @var {SFNode} viewpoint
             * @memberof x3dom.nodeTypes.RenderedTexture
             * @initvalue x3dom.nodeTypes.X3DViewpointNode
             * @field x3dom
             * @instance
             */
            this.addField_SFNode('viewpoint', x3dom.nodeTypes.X3DViewpointNode);

            /**
             *
             * @var {SFNode} background
             * @memberof x3dom.nodeTypes.RenderedTexture
             * @initvalue x3dom.nodeTypes.X3DBackgroundNode
             * @field x3dom
             * @instance
             */
            this.addField_SFNode('background', x3dom.nodeTypes.X3DBackgroundNode);

            /**
             *
             * @var {SFNode} fog
             * @memberof x3dom.nodeTypes.RenderedTexture
             * @initvalue x3dom.nodeTypes.X3DFogNode
             * @field x3dom
             * @instance
             */
            this.addField_SFNode('fog', x3dom.nodeTypes.X3DFogNode);    //TODO

            /**
             *
             * @var {SFNode} scene
             * @memberof x3dom.nodeTypes.RenderedTexture
             * @initvalue x3dom.nodeTypes.X3DNode
             * @field x3dom
             * @instance
             */
            this.addField_SFNode('scene', x3dom.nodeTypes.X3DNode);

            /**
             *
             * @var {MFNode} excludeNodes
             * @memberof x3dom.nodeTypes.RenderedTexture
             * @initvalue x3dom.nodeTypes.X3DNode
             * @field x3dom
             * @instance
             */
            this.addField_MFNode('excludeNodes', x3dom.nodeTypes.X3DNode);

            /**
             *
             * @var {MFInt32} dimensions
             * @memberof x3dom.nodeTypes.RenderedTexture
             * @initvalue [128,128,4]
             * @field x3dom
             * @instance
             */
            this.addField_MFInt32(ctx, 'dimensions', [128, 128, 4]);    // w, h, color components (and numMRTs)

            /**
             *
             * @var {SFString} update
             * @memberof x3dom.nodeTypes.RenderedTexture
             * @initvalue 'NONE'
             * @field x3dom
             * @instance
             */
            this.addField_SFString(ctx, 'update', 'NONE');         // ("NONE"|"NEXT_FRAME_ONLY"|"ALWAYS")


            /**
             *
             * @var {SFBool} showNormals
             * @memberof x3dom.nodeTypes.RenderedTexture
             * @initvalue false
             * @field x3dom
             * @instance
             */
            this.addField_SFBool(ctx, 'showNormals', false);

            /**
             *
             * @var {SFString} stereoMode
             * @memberof x3dom.nodeTypes.RenderedTexture
             * @initvalue 'NONE'
             * @field x3dom
             * @instance
             */
            this.addField_SFString(ctx, 'stereoMode', 'NONE');     // ("NONE"|"LEFT_EYE"|"RIGHT_EYE")

            /**
             *
             * @var {SFFloat} interpupillaryDistance
             * @memberof x3dom.nodeTypes.RenderedTexture
             * @initvalue 0.064
             * @field x3dom
             * @instance
             */
            this.addField_SFFloat(ctx, 'interpupillaryDistance', 0.064);

            this.hScreenSize = 0.14976;
            this.vScreenSize = 0.09356;
            this.vScreenCenter = this.vScreenSize / 2;
            this.eyeToScreenDistance = 0.041;
            this.lensSeparationDistance = 0.0635;
            this.distortionK = [1.0, 0.22, 0.24, 0.0];
            //hRes, vRes = 1280 x 800
            this.lensCenter = 1 - 2 * this.lensSeparationDistance / this.hScreenSize;

            x3dom.debug.assert(this._vf.dimensions.length >= 3,
                "RenderedTexture.dimensions requires at least 3 entries.");
            this._clearParents = true;
            this._needRenderUpdate = true;
        
        },
        {
            nodeChanged: function()
            {
                this._clearParents = true;
                this._needRenderUpdate = true;
            },

            fieldChanged: function(fieldName)
            {
                switch(fieldName)
                {
                    case "excludeNodes":
                        this._clearParents = true;
                        break;
                    case "update":
                        if (this._vf.update.toUpperCase() == "NEXT_FRAME_ONLY" ||
                            this._vf.update.toUpperCase() == "ALWAYS") {
                            this._needRenderUpdate = true;
                        }
                        break;
                    default:
                        // TODO: dimensions
                        break;
                }
            },

            getViewMatrix: function ()
            {
                if (this._clearParents && this._cf.excludeNodes.nodes.length) {
                    // FIXME; avoid recursions cleverer and more generic than this
                    //        (Problem: nodes in excludeNodes field have this node
                    //         as first parent, which leads to a recursion loop in
                    //         getCurrentTransform()
                    var that = this;

                    Array.forEach(this._cf.excludeNodes.nodes, function(node) {
                        for (var i=0, n=node._parentNodes.length; i < n; i++) {
                            if (node._parentNodes[i] === that) {
                                node._parentNodes.splice(i, 1);
                                node.parentRemoved(that);
                            }
                        }
                    });

                    this._clearParents = false;
                }

                var locScene = this._cf.scene.node;
                var scene = this._nameSpace.doc._scene;
                var vbP = scene.getViewpoint();
                var view = this._cf.viewpoint.node;
                var ret_mat = null;

                if (view === null || view === vbP) {
                    ret_mat = this._nameSpace.doc._viewarea.getViewMatrix();
                }
                else if (locScene && locScene !== scene) {
                    // in case of completely local scene do not transform local viewpoint
                    ret_mat = view.getViewMatrix()
                }
                else {
                    var mat_viewpoint = view.getCurrentTransform();
                    ret_mat = view.getViewMatrix().mult(mat_viewpoint.inverse());
                }

                var stereoMode = this._vf.stereoMode.toUpperCase();
                if (stereoMode != "NONE") {
                    var d = this._vf.interpupillaryDistance / 2;
                    if (stereoMode == "RIGHT_EYE") {
                        d = -d;
                    }
                    var modifier = new x3dom.fields.SFMatrix4f(
                        1, 0, 0, d,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        0, 0, 0, 1
                    );
                    ret_mat = modifier.mult(ret_mat);
                }

                return ret_mat;
            },

            getProjectionMatrix: function()
            {
                var doc = this._nameSpace.doc;
                var vbP = doc._scene.getViewpoint();
                var view = this._cf.viewpoint.node;
                var ret_mat = null;
                var f, w = this._vf.dimensions[0], h = this._vf.dimensions[1];
                var stereoMode = this._vf.stereoMode.toUpperCase();
                var stereo = (stereoMode != "NONE");

                if (view === null || view === vbP) {
                    ret_mat = x3dom.fields.SFMatrix4f.copy(doc._viewarea.getProjectionMatrix());
                    if (stereo) {
                        f = 2 * Math.atan(this.vScreenSize / (2 * this.eyeToScreenDistance));
                        f = 1 / Math.tan(f / 2);
                    }
                    else {
                        f = 1 / Math.tan(vbP._vf.fieldOfView / 2);
                    }
                    ret_mat._00 = f / (w / h);
                    ret_mat._11 = f;
                }
                else {
                    ret_mat = view.getProjectionMatrix(w / h);
                }

                if (stereo) {
                    var hp = this.lensCenter;
                    if (stereoMode == "RIGHT_EYE") {
                        hp = -hp;
                    }
                    var modifier = new x3dom.fields.SFMatrix4f(
                        1, 0, 0, hp,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        0, 0, 0, 1
                    );
                    ret_mat = modifier.mult(ret_mat);
                }

                return ret_mat;
            },

            getWCtoCCMatrix: function()
            {
                var view = this.getViewMatrix();
                var proj = this.getProjectionMatrix();

                return proj.mult(view);
            },

            parentRemoved: function(parent)
            {
                if (this._parentNodes.length === 0) {
                    var doc = this.findX3DDoc();

                    for (var i=0, n=doc._nodeBag.renderTextures.length; i<n; i++) {
                        if (doc._nodeBag.renderTextures[i] === this) {
                            doc._nodeBag.renderTextures.splice(i, 1);
                        }
                    }
                }

                if (this._cf.scene.node) {
                    this._cf.scene.node.parentRemoved(this);
                }
            },

            requirePingPong: function()
            {
                return false;
            }
        }
    )
);